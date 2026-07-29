import routeRepository from "../repositories/route.repository.js";
import reportRepository from "../repositories/report.repository.js";
import pedestrianRoutingService from "./pedestrian-routing.service.js";
import safetyAnalysisService from "./safety-analysis.service.js";

type Destination =
    | { mode: "REGISTERED"; id: number }
    | { mode: "EXTERNAL"; lat: number; lng: number; nombre?: string; direccion?: string; placeId?: string };

class RouteService {
    findAll() { return routeRepository.findAll(); }

    async findById(id: number) {
        if (!Number.isInteger(id) || id < 1) throw new Error("ID de ruta inválido");
        const route = await routeRepository.findById(id);
        if (!route) throw new Error("Ruta no encontrada");
        return route;
    }

    async create(data: any) {
        const id = await routeRepository.create(data);
        return this.findById(id);
    }

    async update(id: number, data: any) {
        await this.findById(id);
        await routeRepository.update(id, data);
        return this.findById(id);
    }

    async delete(id: number) {
        await this.findById(id);
        await routeRepository.delete(id);
        return { success: true, message: "Ruta eliminada correctamente" };
    }

    async trazarRuta(originLat: number, originLng: number, destination: Destination) {
        const registeredDestination = destination.mode === "REGISTERED"
            ? await routeRepository.findDestination(destination.id)
            : null;
        if (destination.mode === "REGISTERED" && !registeredDestination) throw new Error("Destino no encontrado");

        const catalogRoute = destination.mode === "REGISTERED"
            ? await routeRepository.findRecommendedByDestination(destination.id)
            : null;
        const destinationPoint: [number, number] = destination.mode === "EXTERNAL"
            ? [destination.lat, destination.lng]
            : [Number(registeredDestination!.latitud), Number(registeredDestination!.longitud)];

        if (!pedestrianRoutingService.isConfigured()) {
            throw new Error("Google Routes no está configurado en el servidor");
        }

        const googleRoutes = await pedestrianRoutingService.calculate([originLat, originLng], destinationPoint);
        if (!googleRoutes.length) throw new Error("Google Routes no pudo calcular un trayecto peatonal");

        const [reports, riskZones] = await Promise.all([
            reportRepository.findActiveReportsByCity("Loja"),
            reportRepository.findRiskZonesByCity("Loja")
        ]);

        const options = googleRoutes.map((route) => {
            const safety = safetyAnalysisService.evaluate(route.coordinates, reports as any, riskZones as any);
            return {
                id_alternativa: route.id,
                etiqueta: "Ruta alternativa",
                distancia_m: route.distanceMeters,
                tiempo_estimado: route.durationMinutes,
                puntuacion_seguridad: safety.score,
                nivel_seguridad_estimado: safety.classification,
                nivel_riesgo: safety.risk_level,
                razones: safety.reasons,
                reportes_cercanos: safety.nearby_reports,
                zonas_riesgo_cruzadas: safety.crossed_risk_zones,
                coordenadas: route.coordinates,
                instrucciones: route.instructions,
                fuente_trazado: "GOOGLE_ROUTES" as const,
                aviso: safety.warning
            };
        }).sort((left, right) =>
            right.puntuacion_seguridad - left.puntuacion_seguridad
            || left.tiempo_estimado - right.tiempo_estimado
            || left.distancia_m - right.distancia_m
        ).slice(0, 2);

        options[0].etiqueta = "Ruta recomendada";
        if (options[1]) options[1].etiqueta = "Ruta alternativa";
        const recommended = options[0];
        const routeName = catalogRoute?.nombre_ruta
            ?? (destination.mode === "EXTERNAL" && destination.nombre ? `Camino a ${destination.nombre}` : "Trayecto al destino");

        return {
            id_ruta: catalogRoute?.id_ruta ?? null,
            nombre_ruta: routeName,
            nivel_seguridad: catalogRoute?.nivel_seguridad ?? null,
            ruta_catalogada: Boolean(catalogRoute),
            trazado_manual: false,
            trazado_peatonal: true,
            origen_usuario: [originLat, originLng],
            ...recommended,
            fuente_trazado: "GOOGLE_ROUTES",
            alternativas: options,
            alternativa_disponible: options.length > 1,
            mensaje_alternativas: options.length > 1
                ? "Se compararon rutas peatonales reales y se priorizó la de mayor puntuación de seguridad."
                : "Google Routes no devolvió una alternativa peatonal real distinta para este trayecto."
        };
    }
}

export default new RouteService();

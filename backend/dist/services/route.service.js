import routeRepository from "../repositories/route.repository.js";
import reportRepository from "../repositories/report.repository.js";
import googleRoutesService from "./google-routes.service.js";
import safetyAnalysisService from "./safety-analysis.service.js";
function distanceMeters(a, b) {
    const radians = (degrees) => (degrees * Math.PI) / 180;
    const earthRadius = 6371000;
    const deltaLat = radians(b[0] - a[0]);
    const deltaLng = radians(b[1] - a[1]);
    const value = Math.sin(deltaLat / 2) ** 2 +
        Math.cos(radians(a[0])) * Math.cos(radians(b[0])) * Math.sin(deltaLng / 2) ** 2;
    return 2 * earthRadius * Math.asin(Math.sqrt(value));
}
class RouteService {
    findAll() {
        return routeRepository.findAll();
    }
    async findById(id) {
        if (!Number.isInteger(id) || id < 1)
            throw new Error("ID de ruta inválido");
        const route = await routeRepository.findById(id);
        if (!route)
            throw new Error("Ruta no encontrada");
        return route;
    }
    async create(data) {
        const id = await routeRepository.create(data);
        return this.findById(id);
    }
    async update(id, data) {
        await this.findById(id);
        await routeRepository.update(id, data);
        return this.findById(id);
    }
    async delete(id) {
        await this.findById(id);
        await routeRepository.delete(id);
        return { success: true, message: "Ruta eliminada correctamente" };
    }
    async trazarRuta(originLat, originLng, destinationId, externalDestination) {
        const destination = destinationId ? await routeRepository.findDestination(destinationId) : null;
        if (!destination && !externalDestination)
            throw new Error("Destino no encontrado");
        const recommended = destinationId ? await routeRepository.findRecommendedByDestination(destinationId) : null;
        const origin = [originLat, originLng];
        const destinationPoint = externalDestination
            ? [externalDestination.lat, externalDestination.lng]
            : [Number(destination.latitud), Number(destination.longitud)];
        const destinationName = externalDestination?.nombre || destination?.nombre || "Destino seleccionado";
        const destinationAddress = externalDestination?.direccion || destination?.direccion || "Loja, Ecuador";
        // Cargar reportes incidentales activos y zonas de riesgo en la ciudad (Loja)
        let activeReports = [];
        let riskZones = [];
        try {
            const rawReports = await reportRepository.findActiveReportsByCity("Loja");
            activeReports = rawReports.map((r) => ({
                id_reporte: Number(r.id_reporte),
                descripcion: String(r.descripcion || ""),
                nivel_riesgo: r.nivel_riesgo,
                fecha_reporte: r.fecha_reporte,
                latitud: Number(r.latitud),
                longitud: Number(r.longitud)
            }));
            const rawZones = await reportRepository.findRiskZonesByCity("Loja");
            riskZones = rawZones.map((z) => ({
                id_reporte: Number(z.id_reporte),
                ubicacion_nombre: String(z.ubicacion_nombre || ""),
                nivel_riesgo: z.nivel_riesgo,
                radio_metros: Number(z.radio_metros) || 80,
                latitud: Number(z.latitud),
                longitud: Number(z.longitud)
            }));
        }
        catch (err) {
            console.warn("No fue posible cargar datos de seguridad de MySQL:", err instanceof Error ? err.message : err);
        }
        // Intentar cálculo peatonal con Google Routes
        let googleRoute = null;
        try {
            googleRoute = await googleRoutesService.calculate(origin, destinationPoint);
        }
        catch (error) {
            console.warn("Fallo al consultar Google Routes API:", error instanceof Error ? error.message : error);
        }
        if (googleRoute && googleRoute.coordinates.length >= 2) {
            const safety = safetyAnalysisService.evaluate(googleRoute.coordinates, activeReports, riskZones);
            return {
                route_id: recommended?.id_ruta ?? null,
                source: "GOOGLE_ROUTES",
                travel_mode: "WALK",
                origin: { lat: originLat, lng: originLng },
                destination: {
                    location_id: destinationId ?? null,
                    place_id: externalDestination?.place_id ?? null,
                    name: destinationName,
                    address: destinationAddress,
                    lat: destinationPoint[0],
                    lng: destinationPoint[1]
                },
                distance_m: googleRoute.distanceMeters,
                duration_min: googleRoute.durationMinutes,
                encoded_polyline: googleRoute.encodedPolyline,
                coordinates: googleRoute.coordinates,
                steps: googleRoute.instructions,
                safety,
                // Campos de compatibilidad retroactiva
                id_ruta: recommended?.id_ruta ?? null,
                nombre_ruta: recommended?.nombre_ruta ?? `Camino a ${destinationName}`,
                nivel_seguridad: safety.classification === "SEGURA" ? "BAJO" : safety.classification === "PRECAUCIÓN" ? "MEDIO" : "ALTO",
                tiempo_estimado: googleRoute.durationMinutes,
                distancia_m: googleRoute.distanceMeters,
                ruta_catalogada: Boolean(recommended),
                trazado_manual: false,
                trazado_peatonal: true,
                fuente_trazado: "GOOGLE_ROUTES",
                instrucciones: googleRoute.instructions,
                origen_usuario: origin,
                coordenadas: googleRoute.coordinates,
                aviso: "Trayecto peatonal calculado con Google Routes. Las condiciones de seguridad se evalúan con los datos del sistema."
            };
        }
        // Trazado de respaldo referencial en caso de falla de Google Routes
        const fallbackCoordinates = [origin, destinationPoint];
        const fallbackDistance = Math.round(distanceMeters(origin, destinationPoint));
        const fallbackDuration = Math.max(1, Math.ceil(fallbackDistance / 80));
        const fallbackSafety = safetyAnalysisService.evaluate(fallbackCoordinates, activeReports, riskZones);
        return {
            route_id: recommended?.id_ruta ?? null,
            source: "REFERENCIAL",
            travel_mode: "WALK",
            origin: { lat: originLat, lng: originLng },
            destination: {
                location_id: destinationId ?? null,
                place_id: externalDestination?.place_id ?? null,
                name: destinationName,
                address: destinationAddress,
                lat: destinationPoint[0],
                lng: destinationPoint[1]
            },
            distance_m: fallbackDistance,
            duration_min: fallbackDuration,
            encoded_polyline: "",
            coordinates: fallbackCoordinates,
            steps: [
                {
                    instruction: `Dirígete en línea recta hacia ${destinationName}`,
                    distance_m: fallbackDistance,
                    duration_min: fallbackDuration
                }
            ],
            safety: fallbackSafety,
            // Campos de compatibilidad retroactiva
            id_ruta: recommended?.id_ruta ?? null,
            nombre_ruta: `Trayecto referencial a ${destinationName}`,
            nivel_seguridad: fallbackSafety.classification === "SEGURA" ? "BAJO" : fallbackSafety.classification === "PRECAUCIÓN" ? "MEDIO" : "ALTO",
            tiempo_estimado: fallbackDuration,
            distancia_m: fallbackDistance,
            ruta_catalogada: Boolean(recommended),
            trazado_manual: false,
            trazado_peatonal: false,
            fuente_trazado: "REFERENCIAL",
            instrucciones: [
                {
                    instruction: `Dirígete en línea recta hacia ${destinationName}`,
                    distance_m: fallbackDistance,
                    duration_min: fallbackDuration
                }
            ],
            origen_usuario: origin,
            coordenadas: fallbackCoordinates,
            aviso: "No fue posible obtener la ruta de Google Routes; se muestra un trazado referencial directo. Verifica el entorno antes de caminar."
        };
    }
}
export default new RouteService();

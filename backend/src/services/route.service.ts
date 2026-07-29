import routeRepository from "../repositories/route.repository.js";
import pedestrianRoutingService from "./pedestrian-routing.service.js";

function distanceMeters(a: [number, number], b: [number, number]) {
    const radians = (degrees: number) => degrees * Math.PI / 180;
    const earthRadius = 6371000;
    const deltaLat = radians(b[0] - a[0]);
    const deltaLng = radians(b[1] - a[1]);
    const value = Math.sin(deltaLat / 2) ** 2
        + Math.cos(radians(a[0])) * Math.cos(radians(b[0])) * Math.sin(deltaLng / 2) ** 2;
    return 2 * earthRadius * Math.asin(Math.sqrt(value));
}

class RouteService {
    findAll() {
        return routeRepository.findAll();
    }

    async findById(id: number) {
        if (!Number.isInteger(id) || id < 1) throw new Error("ID de ruta invÃ¡lido");
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

    async trazarRuta(originLat: number, originLng: number, destination: { mode: "REGISTERED"; id: number } | { mode: "EXTERNAL"; lat: number; lng: number; nombre?: string; direccion?: string; placeId?: string }) {
        const registeredDestination = destination.mode === "REGISTERED" ? await routeRepository.findDestination(destination.id) : null;
        if (destination.mode === "REGISTERED" && !registeredDestination) throw new Error("Destino no encontrado");
        const recommended = destination.mode === "REGISTERED" ? await routeRepository.findRecommendedByDestination(destination.id) : null;
        const manualTrace: [number, number][] = recommended?.trazado?.map((point: any) => [
            Number(point.latitud), Number(point.longitud)
        ]) ?? [];
        const catalogPoints: [number, number][] = recommended?.puntos?.map((point: any) => [
            Number(point.latitud), Number(point.longitud)
        ]) ?? [];
        const origin: [number, number] = [originLat, originLng];
        const destinationPoint: [number, number] = destination.mode === "EXTERNAL"
            ? [destination.lat, destination.lng]
            : [Number(registeredDestination!.latitud), Number(registeredDestination!.longitud)];
        const anchorToOrigin = (points: [number, number][]) => {
            if (points.length < 2) return null;
            const startDistance = distanceMeters(origin, points[0]);
            if (startDistance > 50) return null;
            return startDistance > 1 ? [origin, ...points] : points;
        };
        const applicableManualTrace = anchorToOrigin(manualTrace);
        const applicableCatalogPoints = anchorToOrigin(catalogPoints);
        const fallbackMatchesOrigin = Boolean(applicableManualTrace || applicableCatalogPoints);
        const hasCatalogFallback = manualTrace.length >= 2 || catalogPoints.length >= 2;
        const fallbackCoordinates: [number, number][] = applicableManualTrace
            ?? applicableCatalogPoints
            ?? [origin, destinationPoint];
        const fallbackDistance = fallbackCoordinates.slice(1).reduce(
            (total, point, index) => total + distanceMeters(fallbackCoordinates[index], point),
            0
        );

        let pedestrianRoute = null;
        let routingError = false;
        try {
            pedestrianRoute = await pedestrianRoutingService.calculate(
                [originLat, originLng],
                destinationPoint
            );
        } catch (error) {
            routingError = true;
            console.warn("No fue posible calcular la ruta peatonal externa:", error instanceof Error ? error.message : error);
        }

        const coordinates = pedestrianRoute?.coordinates ?? fallbackCoordinates;
        const source = pedestrianRoute
            ? "GOOGLE_ROUTES"
            : applicableManualTrace
                ? "TRAZADO_MANUAL"
                : "REFERENCIAL";

        return {
            id_ruta: recommended?.id_ruta ?? null,
            nombre_ruta: recommended?.nombre_ruta ?? (destination.mode === "EXTERNAL" && destination.nombre ? "Camino a " + destination.nombre : "Trayecto referencial al destino"),
            nivel_seguridad: recommended?.nivel_seguridad ?? null,
            tiempo_estimado: pedestrianRoute?.durationMinutes
                ?? recommended?.tiempo_estimado
                ?? Math.max(1, Math.ceil(fallbackDistance / 80)),
            distancia_m: pedestrianRoute?.distanceMeters ?? Math.round(fallbackDistance),
            ruta_catalogada: Boolean(recommended),
            trazado_manual: Boolean(applicableManualTrace),
            trazado_peatonal: Boolean(pedestrianRoute),
            fuente_trazado: source,
            instrucciones: pedestrianRoute?.instructions ?? [],
            origen_usuario: [originLat, originLng],
            coordenadas: coordinates,
            aviso: pedestrianRoute
                ? recommended
                    ? "Trayecto peatonal calculado hacia un destino seguro registrado. Revisa las condiciones actuales del entorno."
                    : "Trayecto peatonal calculado por calles y senderos; el proveedor no garantiza por si solo la seguridad del recorrido."
                : hasCatalogFallback && !fallbackMatchesOrigin
                    ? "El respaldo catalogado no inicia cerca de tu ubicacion; se muestra una referencia directa al destino. No la uses como navegacion peatonal."
                : routingError
                    ? "El calculo peatonal no respondio; se muestra el respaldo disponible. Intenta nuevamente antes de iniciar."
                    : pedestrianRoutingService.isConfigured()
                        ? "No se obtuvo una ruta peatonal; se muestra el respaldo disponible."
                        : "Configura OpenRouteService para seguir calles y senderos; mientras tanto se muestra el trazado manual o referencial."
        };
    }
}

export default new RouteService();

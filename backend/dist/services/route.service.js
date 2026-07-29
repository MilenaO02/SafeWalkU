import routeRepository from "../repositories/route.repository.js";
import pedestrianRoutingService from "./pedestrian-routing.service.js";
class RouteService {
    findAll() {
        return routeRepository.findAll();
    }
    async findById(id) {
        if (!Number.isInteger(id) || id < 1)
            throw new Error("ID de ruta invÃ¡lido");
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
    async trazarRuta(originLat, originLng, destination) {
        const registeredDestination = destination.mode === "REGISTERED" ? await routeRepository.findDestination(destination.id) : null;
        if (destination.mode === "REGISTERED" && !registeredDestination)
            throw new Error("Destino no encontrado");
        const recommended = destination.mode === "REGISTERED" ? await routeRepository.findRecommendedByDestination(destination.id) : null;
        const destinationPoint = destination.mode === "EXTERNAL"
            ? [destination.lat, destination.lng]
            : [Number(registeredDestination.latitud), Number(registeredDestination.longitud)];
        if (!pedestrianRoutingService.isConfigured()) {
            throw new Error("Google Routes no está configurado en el servidor");
        }
        const pedestrianRoute = await pedestrianRoutingService.calculate([originLat, originLng], destinationPoint);
        if (!pedestrianRoute) {
            throw new Error("Google Routes no pudo calcular un trayecto peatonal");
        }
        return {
            id_ruta: recommended?.id_ruta ?? null,
            nombre_ruta: recommended?.nombre_ruta ?? (destination.mode === "EXTERNAL" && destination.nombre ? "Camino a " + destination.nombre : "Trayecto referencial al destino"),
            nivel_seguridad: recommended?.nivel_seguridad ?? null,
            tiempo_estimado: pedestrianRoute.durationMinutes,
            distancia_m: pedestrianRoute.distanceMeters,
            ruta_catalogada: Boolean(recommended),
            trazado_manual: false,
            trazado_peatonal: true,
            fuente_trazado: "GOOGLE_ROUTES",
            instrucciones: pedestrianRoute.instructions,
            origen_usuario: [originLat, originLng],
            coordenadas: pedestrianRoute.coordinates,
            aviso: recommended
                ? "Trayecto peatonal calculado hacia un destino seguro registrado. Revisa las condiciones actuales del entorno."
                : "Trayecto peatonal calculado por Google Routes; verifica las condiciones actuales antes de iniciar."
        };
    }
}
export default new RouteService();

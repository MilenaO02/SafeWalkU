import googleRoutesService from "./google-routes.service.js";
function durationToSeconds(value) {
    const seconds = Number(value?.replace(/s$/, "") ?? 0);
    return Number.isFinite(seconds) ? seconds : 0;
}
class PedestrianRoutingService {
    isConfigured() {
        return googleRoutesService.isConfigured();
    }
    async calculate(origin, destination) {
        const routes = await googleRoutesService.calculate(origin, destination);
        const route = routes[0];
        if (!route)
            return null;
        return {
            id: `google-route-${Date.now()}`,
            coordinates: route.coordinates,
            distanceMeters: route.distanceMeters,
            durationMinutes: route.durationMinutes,
            encodedPolyline: route.encodedPolyline,
            instructions: route.instructions,
        };
    }
    async calculateAll(origin, destination) {
        const routes = await googleRoutesService.calculate(origin, destination);
        return routes.map((route, idx) => ({
            id: `google-route-alt-${Date.now()}-${idx}`,
            coordinates: route.coordinates,
            distanceMeters: route.distanceMeters,
            durationMinutes: route.durationMinutes,
            encodedPolyline: route.encodedPolyline,
            instructions: route.instructions,
        }));
    }
}
export default new PedestrianRoutingService();

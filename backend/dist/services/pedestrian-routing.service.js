import googleRoutesService from "./google-routes.service.js";
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
            coordinates: route.coordinates,
            distanceMeters: route.distanceMeters,
            durationMinutes: route.durationMinutes,
            encodedPolyline: route.encodedPolyline,
            instructions: route.instructions,
        };
    }
    async calculateAll(origin, destination) {
        const routes = await googleRoutesService.calculate(origin, destination);
        return routes.map((route) => ({
            coordinates: route.coordinates,
            distanceMeters: route.distanceMeters,
            durationMinutes: route.durationMinutes,
            encodedPolyline: route.encodedPolyline,
            instructions: route.instructions,
        }));
    }
}
export default new PedestrianRoutingService();

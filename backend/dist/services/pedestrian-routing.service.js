import googleRoutesService from "./google-routes.service.js";
class PedestrianRoutingService {
    isConfigured() {
        return googleRoutesService.isConfigured();
    }
    async calculate(origin, destination) {
        const route = await googleRoutesService.calculate(origin, destination);
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
}
export default new PedestrianRoutingService();

import googleRoutesService, { GoogleRoute } from "./google-routes.service.js";

export type Coordinate = [number, number];

export type PedestrianRoute = {
    coordinates: Coordinate[];
    distanceMeters: number;
    durationMinutes: number;
    encodedPolyline?: string;
    instructions: Array<{ instruction: string; distance_m: number; duration_min: number }>;
};

class PedestrianRoutingService {
    isConfigured(): boolean {
        return googleRoutesService.isConfigured();
    }

    async calculate(origin: Coordinate, destination: Coordinate): Promise<PedestrianRoute | null> {
        const routes: GoogleRoute[] = await googleRoutesService.calculate(origin, destination);
        const route = routes[0];
        if (!route) return null;

        return {
            coordinates: route.coordinates,
            distanceMeters: route.distanceMeters,
            durationMinutes: route.durationMinutes,
            encodedPolyline: route.encodedPolyline,
            instructions: route.instructions,
        };
    }

    async calculateAll(origin: Coordinate, destination: Coordinate): Promise<PedestrianRoute[]> {
        const routes: GoogleRoute[] = await googleRoutesService.calculate(origin, destination);
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

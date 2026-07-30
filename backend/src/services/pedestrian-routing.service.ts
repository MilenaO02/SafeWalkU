import googleRoutesService, { GoogleRoute } from "./google-routes.service.js";

export type Coordinate = [number, number];

export type PedestrianRoute = {
    id: string;
    coordinates: Coordinate[];
    distanceMeters: number;
    durationMinutes: number;
    encodedPolyline?: string;
    instructions: Array<{ instruction: string; distance_m: number; duration_min: number }>;
};

function durationToSeconds(value?: string): number {
    const seconds = Number(value?.replace(/s$/, "") ?? 0);
    return Number.isFinite(seconds) ? seconds : 0;
}

class PedestrianRoutingService {
    isConfigured(): boolean {
        return googleRoutesService.isConfigured();
    }

    async calculate(origin: Coordinate, destination: Coordinate): Promise<PedestrianRoute | null> {
        const routes: GoogleRoute[] = await googleRoutesService.calculate(origin, destination);
        const route = routes[0];
        if (!route) return null;

        return {
            id: `google-route-${Date.now()}`,
            coordinates: route.coordinates,
            distanceMeters: route.distanceMeters,
            durationMinutes: route.durationMinutes,
            encodedPolyline: route.encodedPolyline,
            instructions: route.instructions,
        };
    }

    async calculateAll(origin: Coordinate, destination: Coordinate): Promise<PedestrianRoute[]> {
        const routes: GoogleRoute[] = await googleRoutesService.calculate(origin, destination);
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

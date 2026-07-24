type Coordinate = [number, number];

type OrsResponse = {
    features?: Array<{
        geometry?: { coordinates?: Array<[number, number]> };
        properties?: {
            summary?: { distance?: number; duration?: number };
            segments?: Array<{
                steps?: Array<{
                    instruction?: string;
                    distance?: number;
                    duration?: number;
                }>;
            }>;
        };
    }>;
};

export type PedestrianRoute = {
    coordinates: Coordinate[];
    distanceMeters: number;
    durationMinutes: number;
    instructions: Array<{ instruction: string; distance_m: number; duration_min: number }>;
};

class PedestrianRoutingService {
    isConfigured() {
        return Boolean(process.env.OPENROUTESERVICE_API_KEY?.trim());
    }

    async calculate(origin: Coordinate, destination: Coordinate): Promise<PedestrianRoute | null> {
        const apiKey = process.env.OPENROUTESERVICE_API_KEY?.trim();
        if (!apiKey) return null;

        const controller = new AbortController();
        const timeoutMs = Math.max(1000, Math.min(Number(process.env.ROUTING_TIMEOUT_MS) || 8000, 20000));
        const timeout = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch("https://api.openrouteservice.org/v2/directions/foot-walking/geojson", {
                method: "POST",
                headers: {
                    Authorization: apiKey,
                    "Content-Type": "application/json",
                    Accept: "application/geo+json, application/json"
                },
                body: JSON.stringify({
                    coordinates: [
                        [origin[1], origin[0]],
                        [destination[1], destination[0]]
                    ],
                    instructions: true,
                    language: "es"
                }),
                signal: controller.signal
            });
            if (!response.ok) throw new Error(`OpenRouteService respondio ${response.status}`);

            const payload = await response.json() as OrsResponse;
            const feature = payload.features?.[0];
            const rawCoordinates = feature?.geometry?.coordinates ?? [];
            const summary = feature?.properties?.summary;
            if (rawCoordinates.length < 2 || !summary?.distance || !summary?.duration) {
                throw new Error("OpenRouteService devolvio una ruta incompleta");
            }

            return {
                coordinates: rawCoordinates.map(([lng, lat]) => [Number(lat), Number(lng)]),
                distanceMeters: Math.round(summary.distance),
                durationMinutes: Math.max(1, Math.ceil(summary.duration / 60)),
                instructions: (feature?.properties?.segments ?? []).flatMap((segment) =>
                    (segment.steps ?? []).map((step) => ({
                        instruction: step.instruction ?? "Continua por el trayecto",
                        distance_m: Math.round(step.distance ?? 0),
                        duration_min: Math.max(0, Math.round(((step.duration ?? 0) / 60) * 10) / 10)
                    }))
                )
            };
        } finally {
            clearTimeout(timeout);
        }
    }
}

export default new PedestrianRoutingService();

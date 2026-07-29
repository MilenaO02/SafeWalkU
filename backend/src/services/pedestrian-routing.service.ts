type Coordinate = [number, number];

type GoogleRouteResponse = {
    routes?: Array<{
        distanceMeters?: number;
        duration?: string;
        polyline?: { geoJsonLinestring?: { coordinates?: Array<[number, number]> } };
        legs?: Array<{ steps?: Array<{
            distanceMeters?: number;
            staticDuration?: string;
            navigationInstruction?: { instructions?: string };
        }> }>;
    }>;
};

export type PedestrianRoute = {
    id: string;
    coordinates: Coordinate[];
    distanceMeters: number;
    durationMinutes: number;
    instructions: Array<{ instruction: string; distance_m: number; duration_min: number }>;
};

function durationToSeconds(value?: string): number {
    const seconds = Number(value?.replace(/s$/, "") ?? 0);
    return Number.isFinite(seconds) ? seconds : 0;
}

class PedestrianRoutingService {
    isConfigured(): boolean {
        return Boolean(process.env.GOOGLE_MAPS_SERVER_API_KEY?.trim());
    }

    async calculate(origin: Coordinate, destination: Coordinate): Promise<PedestrianRoute[]> {
        const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY?.trim();
        if (!apiKey) throw new Error("Google Routes no está configurado en el servidor");

        const controller = new AbortController();
        const timeoutMs = Math.max(1000, Math.min(Number(process.env.ROUTING_TIMEOUT_MS) || 8000, 20000));
        const timeout = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Goog-Api-Key": apiKey,
                    "X-Goog-FieldMask": [
                        "routes.distanceMeters", "routes.duration", "routes.polyline.geoJsonLinestring",
                        "routes.legs.steps.distanceMeters", "routes.legs.steps.staticDuration",
                        "routes.legs.steps.navigationInstruction.instructions"
                    ].join(",")
                },
                body: JSON.stringify({
                    origin: { location: { latLng: { latitude: origin[0], longitude: origin[1] } } },
                    destination: { location: { latLng: { latitude: destination[0], longitude: destination[1] } } },
                    travelMode: "WALK",
                    computeAlternativeRoutes: true,
                    languageCode: "es",
                    units: "METRIC",
                    polylineEncoding: "GEO_JSON_LINESTRING",
                    polylineQuality: "HIGH_QUALITY"
                }),
                signal: controller.signal
            });

            if (!response.ok) {
                const body = await response.json().catch(() => ({})) as { error?: { status?: string } };
                console.error("Google Routes error", { status: response.status, code: body.error?.status || "UPSTREAM_ERROR" });
                throw new Error(`Google Routes respondió ${response.status}`);
            }

            const payload = await response.json() as GoogleRouteResponse;
            const seen = new Set<string>();
            return (payload.routes ?? []).flatMap((route, index) => {
                const raw = route.polyline?.geoJsonLinestring?.coordinates ?? [];
                if (raw.length < 2) return [];
                const coordinates: Coordinate[] = raw.map(([lng, lat]) => [Number(lat), Number(lng)]);
                const signature = coordinates.filter((_, pointIndex) => pointIndex % Math.max(1, Math.floor(coordinates.length / 8)) === 0)
                    .map(([lat, lng]) => `${lat.toFixed(5)},${lng.toFixed(5)}`).join("|");
                if (seen.has(signature)) return [];
                seen.add(signature);
                const instructions = (route.legs ?? []).flatMap((leg) => (leg.steps ?? []).map((step) => ({
                    instruction: step.navigationInstruction?.instructions ?? "Continúa por el trayecto",
                    distance_m: Math.round(step.distanceMeters ?? 0),
                    duration_min: Math.round((durationToSeconds(step.staticDuration) / 60) * 10) / 10
                })));
                return [{
                    id: `google-route-${index + 1}`,
                    coordinates,
                    distanceMeters: Math.round(route.distanceMeters ?? 0),
                    durationMinutes: Math.max(1, Math.ceil(durationToSeconds(route.duration) / 60)),
                    instructions
                }];
            }).slice(0, 3);
        } catch (error) {
            if (error instanceof Error && error.name === "AbortError") {
                console.error("Google Routes excedió el tiempo máximo de espera");
            } else if (!(error instanceof Error && error.message.startsWith("Google Routes respondió"))) {
                console.error("No fue posible calcular la ruta con Google Routes");
            }
            return [];
        } finally {
            clearTimeout(timeout);
        }
    }
}

export default new PedestrianRoutingService();

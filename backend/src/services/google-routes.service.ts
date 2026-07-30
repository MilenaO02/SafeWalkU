type Coordinate = [number, number];

type GoogleRouteResponse = {
    routes?: Array<{
        duration?: string;
        distanceMeters?: number;
        polyline?: { encodedPolyline?: string };
        legs?: Array<{
            steps?: Array<{
                distanceMeters?: number;
                staticDuration?: string;
                navigationInstruction?: { instructions?: string };
            }>;
        }>;
    }>;
};

export type GoogleRouteStep = {
    instruction: string;
    distance_m: number;
    duration_min: number;
};

export type GoogleRoute = {
    coordinates: Coordinate[];
    distanceMeters: number;
    durationMinutes: number;
    encodedPolyline: string;
    instructions: GoogleRouteStep[];
};

function decodePolyline(encoded: string): Coordinate[] {
    const points: Coordinate[] = [];
    let index = 0;
    let latitude = 0;
    let longitude = 0;
    while (index < encoded.length) {
        let shift = 0;
        let result = 0;
        let byte: number;
        do {
            byte = encoded.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);
        latitude += (result & 1) ? ~(result >> 1) : result >> 1;
        shift = 0;
        result = 0;
        do {
            byte = encoded.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);
        longitude += (result & 1) ? ~(result >> 1) : result >> 1;
        points.push([latitude / 1e5, longitude / 1e5]);
    }
    return points;
}

function durationSeconds(value: string | undefined): number {
    const match = value?.match(/^(\d+(?:\.\d+)?)s$/);
    return match ? Number(match[1]) : 0;
}

class GoogleRoutesService {
    isConfigured(): boolean {
        return Boolean(process.env.GOOGLE_MAPS_SERVER_API_KEY?.trim());
    }

    async calculate(origin: Coordinate, destination: Coordinate): Promise<GoogleRoute[]> {
        const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY?.trim();
        if (!apiKey) {
            throw new Error("GOOGLE_MAPS_SERVER_API_KEY no está configurada en el servidor.");
        }

        const isValidCoord = (c: Coordinate) =>
            Array.isArray(c) && c.length >= 2 &&
            Number.isFinite(c[0]) && Number.isFinite(c[1]) &&
            c[0] >= -90 && c[0] <= 90 && c[1] >= -180 && c[1] <= 180 &&
            !(c[0] === 0 && c[1] === 0);

        if (!isValidCoord(origin) || !isValidCoord(destination)) {
            throw new Error("Las coordenadas de origen o destino son inválidas o están vacías.");
        }

        const controller = new AbortController();
        const timeoutMs = Math.max(1000, Math.min(Number(process.env.ROUTING_TIMEOUT_MS) || 8000, 20000));
        const timeout = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Goog-Api-Key": apiKey,
                    "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.steps.distanceMeters,routes.legs.steps.staticDuration,routes.legs.steps.navigationInstruction.instructions"
                },
                body: JSON.stringify({
                    origin: { location: { latLng: { latitude: origin[0], longitude: origin[1] } } },
                    destination: { location: { latLng: { latitude: destination[0], longitude: destination[1] } } },
                    travelMode: "WALK",
                    computeAlternativeRoutes: true,
                    languageCode: "es"
                }),
                signal: controller.signal
            });

            if (!response.ok) {
                const errorBody = await response.text().catch(() => "");
                console.error(`[GoogleRoutesService] HTTP ${response.status} Error:`, errorBody);
                throw new Error(`Google Routes API respondió HTTP ${response.status}: ${errorBody}`);
            }

            const payload = (await response.json()) as GoogleRouteResponse;
            const results: GoogleRoute[] = [];

            for (const route of payload.routes ?? []) {
                const rawPolyline = route?.polyline?.encodedPolyline ?? "";
                const coordinates = rawPolyline ? decodePolyline(rawPolyline) : [];
                if (coordinates.length < 2 || !route.distanceMeters) continue;

                const instructions: GoogleRouteStep[] = (route.legs ?? []).flatMap((leg) =>
                    (leg.steps ?? []).map((step) => ({
                        instruction: step.navigationInstruction?.instructions ?? "Continúa por el trayecto peatonal",
                        distance_m: Math.round(step.distanceMeters ?? 0),
                        duration_min: Math.max(0, Math.round((durationSeconds(step.staticDuration) / 60) * 10) / 10)
                    }))
                );

                results.push({
                    coordinates,
                    distanceMeters: Math.round(route.distanceMeters),
                    durationMinutes: Math.max(1, Math.ceil(durationSeconds(route.duration) / 60)),
                    encodedPolyline: rawPolyline,
                    instructions
                });
            }

            if (results.length === 0) {
                throw new Error("Google Routes API no devolvió alternativas válidas.");
            }

            return results;
        } catch (error) {
            console.error("Error al consultar Google Routes API:", error instanceof Error ? error.message : error);
            throw error;
        } finally {
            clearTimeout(timeout);
        }
    }
}

export default new GoogleRoutesService();

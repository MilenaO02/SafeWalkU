type Coordinate = [number, number];

type GoogleRouteResponse = {
    routes?: Array<{
        distanceMeters?: number;
        duration?: string;
        polyline?: {
            geoJsonLinestring?: {
                type?: string;
                coordinates?: Array<[number, number]>;
            };
        };
        legs?: Array<{
            steps?: Array<{
                distanceMeters?: number;
                staticDuration?: string;
                navigationInstruction?: {
                    instructions?: string;
                };
            }>;
        }>;
    }>;
};

export type PedestrianRoute = {
    coordinates: Coordinate[];
    distanceMeters: number;
    durationMinutes: number;
    instructions: Array<{
        instruction: string;
        distance_m: number;
        duration_min: number;
    }>;
};

function durationToSeconds(value?: string): number {
    if (!value) return 0;

    const seconds = Number(value.replace(/s$/, ""));

    return Number.isFinite(seconds) ? seconds : 0;
}

class PedestrianRoutingService {

    isConfigured(): boolean {
        return Boolean(process.env.GOOGLE_MAPS_SERVER_API_KEY?.trim());
    }

    async calculate(
        origin: Coordinate,
        destination: Coordinate
    ): Promise<PedestrianRoute | null> {

        const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY?.trim();

        if (!apiKey) {
            console.error("GOOGLE_MAPS_SERVER_API_KEY no está configurada");
            return null;
        }

        const controller = new AbortController();

        const timeoutMs = Math.max(
            1000,
            Math.min(
                Number(process.env.ROUTING_TIMEOUT_MS) || 8000,
                20000
            )
        );

        const timeout = setTimeout(
            () => controller.abort(),
            timeoutMs
        );

        try {

            const response = await fetch(
                "https://routes.googleapis.com/directions/v2:computeRoutes",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        "X-Goog-Api-Key": apiKey,

                        "X-Goog-FieldMask": [
                            "routes.distanceMeters",
                            "routes.duration",
                            "routes.polyline.geoJsonLinestring",
                            "routes.legs.steps.distanceMeters",
                            "routes.legs.steps.staticDuration",
                            "routes.legs.steps.navigationInstruction.instructions"
                        ].join(",")
                    },

                    body: JSON.stringify({
                        origin: {
                            location: {
                                latLng: {
                                    latitude: origin[0],
                                    longitude: origin[1]
                                }
                            }
                        },

                        destination: {
                            location: {
                                latLng: {
                                    latitude: destination[0],
                                    longitude: destination[1]
                                }
                            }
                        },

                        travelMode: "WALK",

                        languageCode: "es",

                        units: "METRIC",

                        polylineEncoding: "GEO_JSON_LINESTRING",

                        polylineQuality: "HIGH_QUALITY"
                    }),

                    signal: controller.signal
                }
            );

            if (!response.ok) {

                const errorText = await response.text();

                console.error(
                    `Google Routes respondió ${response.status}:`,
                    errorText
                );

                throw new Error(
                    `Google Routes respondió ${response.status}`
                );
            }

            const payload =
                await response.json() as GoogleRouteResponse;

            const route = payload.routes?.[0];

            if (!route) {
                throw new Error(
                    "Google Routes no devolvió ninguna ruta"
                );
            }

            const rawCoordinates =
                route.polyline?.geoJsonLinestring?.coordinates ?? [];

            if (rawCoordinates.length < 2) {
                throw new Error(
                    "Google Routes devolvió una geometría incompleta"
                );
            }

            const coordinates: Coordinate[] =
                rawCoordinates.map(
                    ([lng, lat]) => [Number(lat), Number(lng)]
                );

            const durationSeconds =
                durationToSeconds(route.duration);

            const instructions =
                (route.legs ?? []).flatMap(
                    (leg) =>
                        (leg.steps ?? []).map((step) => {

                            const seconds =
                                durationToSeconds(
                                    step.staticDuration
                                );

                            return {
                                instruction:
                                    step.navigationInstruction
                                        ?.instructions ??
                                    "Continúa por el trayecto",

                                distance_m:
                                    Math.round(
                                        step.distanceMeters ?? 0
                                    ),

                                duration_min:
                                    Math.round(
                                        (seconds / 60) * 10
                                    ) / 10
                            };
                        })
                );

            return {
                coordinates,

                distanceMeters:
                    Math.round(route.distanceMeters ?? 0),

                durationMinutes:
                    Math.max(
                        1,
                        Math.ceil(durationSeconds / 60)
                    ),

                instructions
            };

        } catch (error) {

            if (
                error instanceof Error &&
                error.name === "AbortError"
            ) {
                console.error(
                    "Google Routes excedió el tiempo máximo de espera"
                );
            } else {
                console.error(
                    "Error calculando ruta con Google Routes:",
                    error
                );
            }

            return null;

        } finally {

            clearTimeout(timeout);
        }
    }
}

export default new PedestrianRoutingService();

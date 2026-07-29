import { Request, Response } from "express";
import { placeDetailsSchema, placesAutocompleteSchema } from "../schemas/places.schema.js";

const PLACES_API_BASE = "https://places.googleapis.com/v1";
const googleKey = () => process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_SERVER_API_KEY || "";
const googleReferrer = () => process.env.GOOGLE_PLACES_REFERRER || "https://safewalku.online/";

async function readGoogleError(response: globalThis.Response) {
    try {
        const payload = await response.json() as {
            error?: { status?: string; details?: Array<{ reason?: string }> };
        };
        return {
            code: payload.error?.status || `HTTP_${response.status}`,
            reason: payload.error?.details?.find((detail) => detail.reason)?.reason || "UPSTREAM_ERROR"
        };
    } catch {
        return { code: `HTTP_${response.status}`, reason: "INVALID_UPSTREAM_RESPONSE" };
    }
}

class PlacesController {
    async autocomplete(req: Request, res: Response) {
        const key = googleKey();
        if (!key) {
            return res.status(503).json({ success: false, message: "El servicio de autocompletado no está configurado." });
        }

        const parsed = placesAutocompleteSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(422).json({ success: false, message: "Parámetros de búsqueda inválidos", errors: parsed.error.issues });
        }

        try {
            const upstream = await fetch(`${PLACES_API_BASE}/places:autocomplete`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Goog-Api-Key": key,
                    "Referer": googleReferrer(),
                    "X-Goog-FieldMask": [
                        "suggestions.placePrediction.place",
                        "suggestions.placePrediction.placeId",
                        "suggestions.placePrediction.text",
                        "suggestions.placePrediction.structuredFormat",
                        "suggestions.placePrediction.types"
                    ].join(",")
                },
                body: JSON.stringify(parsed.data),
                signal: AbortSignal.timeout(8000)
            });

            if (!upstream.ok) {
                const googleError = await readGoogleError(upstream);
                console.error("Google Places autocomplete error", { status: upstream.status, ...googleError });
                return res.status(502).json({
                    success: false,
                    message: "Google Places no está disponible en este momento.",
                    code: googleError.code
                });
            }

            return res.status(200).json({ success: true, data: await upstream.json() });
        } catch (error: unknown) {
            const code = error instanceof Error && error.name === "TimeoutError" ? "UPSTREAM_TIMEOUT" : "UPSTREAM_UNREACHABLE";
            console.error("Places autocomplete proxy error", { code });
            return res.status(502).json({ success: false, message: "No fue posible contactar con Google Places.", code });
        }
    }

    async details(req: Request, res: Response) {
        const key = googleKey();
        if (!key) {
            return res.status(503).json({ success: false, message: "El servicio de detalles no está configurado." });
        }

        const parsed = placeDetailsSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(422).json({ success: false, message: "Identificador de lugar inválido", errors: parsed.error.issues });
        }

        const { place, sessionToken = "", languageCode } = parsed.data;
        const url = new URL(`${PLACES_API_BASE}/${place}`);
        url.searchParams.set("languageCode", languageCode);
        if (sessionToken) url.searchParams.set("sessionToken", sessionToken);

        try {
            const upstream = await fetch(url.toString(), {
                headers: {
                    "X-Goog-Api-Key": key,
                    "Referer": googleReferrer(),
                    "X-Goog-FieldMask": "id,displayName,formattedAddress,location,primaryType"
                },
                signal: AbortSignal.timeout(8000)
            });

            if (!upstream.ok) {
                const googleError = await readGoogleError(upstream);
                console.error("Google Places details error", { status: upstream.status, ...googleError });
                return res.status(502).json({
                    success: false,
                    message: "No fue posible obtener los detalles del lugar.",
                    code: googleError.code
                });
            }

            return res.status(200).json({ success: true, data: await upstream.json() });
        } catch (error: unknown) {
            const code = error instanceof Error && error.name === "TimeoutError" ? "UPSTREAM_TIMEOUT" : "UPSTREAM_UNREACHABLE";
            console.error("Places details proxy error", { code });
            return res.status(502).json({ success: false, message: "No fue posible contactar con Google Places.", code });
        }
    }
}

export default new PlacesController();

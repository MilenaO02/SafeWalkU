import { Request, Response } from "express";
import { placeDetailsSchema, placesAutocompleteSchema } from "../schemas/places.schema.js";

const PLACES_API_BASE = "https://places.googleapis.com/v1";
const GOOGLE_KEY = () => process.env.GOOGLE_MAPS_SERVER_API_KEY || "";

/**
 * PlacesController — server-side proxy for Google Places (New) API.
 *
 * Keeps the server-side API key out of the browser network tab.
 * The frontend sends requests to /api/places/* and this controller
 * forwards them to Google, injects the secret key, and returns the
 * trimmed response.
 */
class PlacesController {
    /**
     * POST /api/places/autocomplete
     * Body forwarded as-is to Google Places autocomplete endpoint.
     * The frontend must NOT include the API key — the proxy adds it.
     */
    async autocomplete(req: Request, res: Response) {
        const key = GOOGLE_KEY();
        if (!key) {
            return res.status(503).json({
                success: false,
                message: "El servicio de autocompletado no está configurado en el servidor."
            });
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
                    "X-Goog-FieldMask":
                        "suggestions.placePrediction.place," +
                        "suggestions.placePrediction.placeId," +
                        "suggestions.placePrediction.text," +
                        "suggestions.placePrediction.structuredFormat"
                },
                body: JSON.stringify(parsed.data),
                signal: AbortSignal.timeout(8000)
            });

            if (!upstream.ok) {
                const errorBody = await upstream.text();
                console.error("Google Places autocomplete error:", upstream.status, errorBody);
                return res.status(502).json({
                    success: false,
                    message: "El servicio de autocompletado de Google no está disponible en este momento."
                });
            }

            const data = await upstream.json();
            return res.status(200).json({ success: true, data });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Error desconocido";
            console.error("Places autocomplete proxy error:", message);
            return res.status(502).json({
                success: false,
                message: "No fue posible contactar con el servicio de autocompletado."
            });
        }
    }

    /**
     * POST /api/maps/places/details
     * Fetches place details from Google Places API.
     * :placeResource is the resource path returned by autocomplete (e.g. "places/ChIJ...").
     */
    async details(req: Request, res: Response) {
        const key = GOOGLE_KEY();
        if (!key) {
            return res.status(503).json({
                success: false,
                message: "El servicio de detalles de lugar no está configurado en el servidor."
            });
        }

        const parsed = placeDetailsSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(422).json({ success: false, message: "Identificador de lugar inválido", errors: parsed.error.issues });
        }

        const { place: placeResource, sessionToken = "", languageCode } = parsed.data;
        const fieldMask = "id,displayName,formattedAddress,location";

        const url = new URL(`${PLACES_API_BASE}/${placeResource}`);
        url.searchParams.set("languageCode", languageCode);
        if (sessionToken) url.searchParams.set("sessionToken", sessionToken);

        try {
            const upstream = await fetch(url.toString(), {
                method: "GET",
                headers: {
                    "X-Goog-Api-Key": key,
                    "X-Goog-FieldMask": fieldMask
                },
                signal: AbortSignal.timeout(8000)
            });

            if (!upstream.ok) {
                const errorBody = await upstream.text();
                console.error("Google Places details error:", upstream.status, errorBody);
                return res.status(502).json({
                    success: false,
                    message: "No fue posible obtener los detalles del lugar seleccionado."
                });
            }

            const data = await upstream.json();
            return res.status(200).json({ success: true, data });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Error desconocido";
            console.error("Places details proxy error:", message);
            return res.status(502).json({
                success: false,
                message: "No fue posible contactar con el servicio de detalles de lugar."
            });
        }
    }
}

export default new PlacesController();

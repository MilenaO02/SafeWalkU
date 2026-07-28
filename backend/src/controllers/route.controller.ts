import { Request, Response } from "express";
import routeService from "../services/route.service.js";
import { traceRouteQuerySchema } from "../schemas/route.schema.js";

class RouteController {

    async getAll(req: Request, res: Response) {
        try {
            const routes = await routeService.findAll();
            return res.status(200).json({ success: true, data: routes });
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Error interno";
            return res.status(500).json({ success: false, message: msg });
        }
    }

    async getById(req: Request, res: Response) {
        try {
            const id = Number(req.params.id);
            const route = await routeService.findById(id);
            return res.status(200).json({ success: true, data: route });
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "No encontrado";
            return res.status(404).json({ success: false, message: msg });
        }
    }

    async create(req: Request, res: Response) {
        try {
            const route = await routeService.create(req.body);
            return res.status(201).json({
                success: true,
                message: "Ruta creada correctamente",
                data: route,
            });
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Error al crear";
            return res.status(400).json({ success: false, message: msg });
        }
    }

    async update(req: Request, res: Response) {
        try {
            const id = Number(req.params.id);
            const route = await routeService.update(id, req.body);
            return res.status(200).json({
                success: true,
                message: "Ruta actualizada correctamente",
                data: route,
            });
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Error al actualizar";
            return res.status(400).json({ success: false, message: msg });
        }
    }

    async delete(req: Request, res: Response) {
        try {
            const id = Number(req.params.id);
            const result = await routeService.delete(id);
            return res.status(200).json(result);
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "No encontrado";
            return res.status(404).json({ success: false, message: msg });
        }
    }

    /**
     * GET /api/routes/trazar
     *
     * Modalidad 1 — registered destination:
     *   ?origen_lat=&origen_lng=&destino_id=
     *
     * Modalidad 2 — external destination (Google Places or coords):
     *   ?origen_lat=&origen_lng=&destino_lat=&destino_lng=
     *   &destino_nombre=  (optional)
     *   &destino_direccion=  (optional)
     *   &place_id=  (optional)
     *
     * Returns 422 when:
     *   - Required origin fields are missing or out of range
     *   - Neither destino_id nor (destino_lat + destino_lng) are provided
     *   - Both modalities are mixed together
     */
    async trazarRuta(req: Request, res: Response) {
        // ── 1. Validate & parse query params ──────────────────────────────
        const parsed = traceRouteQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            return res.status(422).json({
                success: false,
                message: "Parámetros geográficos inválidos.",
                errors: parsed.error.issues.map((i) => ({
                    path: i.path.join(".") || "query",
                    message: i.message,
                })),
            });
        }

        const data = parsed.data;

        // ── 2. Delegate to service ─────────────────────────────────────────
        try {
            const externalDestination =
                data.destino_lat !== undefined && data.destino_lng !== undefined
                    ? {
                        lat: data.destino_lat,
                        lng: data.destino_lng,
                        nombre: data.destino_nombre,
                        direccion: data.destino_direccion,
                        place_id: data.place_id,
                    }
                    : undefined;

            const result = await routeService.trazarRuta(
                data.origen_lat,
                data.origen_lng,
                data.destino_id,
                externalDestination
            );

            return res.status(200).json({ success: true, data: result });
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Error al trazar la ruta";
            const status = msg === "Destino no encontrado" ? 404 : 500;
            return res.status(status).json({ success: false, message: msg });
        }
    }
}

export default new RouteController();

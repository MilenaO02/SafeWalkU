import { Request, Response } from "express";
import routeService, { TraceRouteParams } from "../services/route.service.js";
import { traceRouteQuerySchema } from "../schemas/route.schema.js";

class RouteController {

    async getAll(req: Request, res: Response) {

        try {

            const routes = await routeService.findAll();

            return res.status(200).json({

                success: true,

                data: routes

            });

        } catch (error: any) {

            return res.status(500).json({

                success: false,

                message: error.message

            });

        }

    }

    async getById(req: Request, res: Response) {

        try {

            const id = Number(req.params.id);

            const route = await routeService.findById(id);

            return res.status(200).json({

                success: true,

                data: route

            });

        } catch (error: any) {

            return res.status(404).json({

                success: false,

                message: error.message

            });

        }

    }

    async create(req: Request, res: Response) {

        try {

            const route = await routeService.create(req.body);

            return res.status(201).json({

                success: true,

                message: "Ruta creada correctamente",

                data: route

            });

        } catch (error: any) {

            return res.status(400).json({

                success: false,

                message: error.message

            });

        }

    }

    async update(req: Request, res: Response) {

        try {

            const id = Number(req.params.id);

            const route = await routeService.update(id, req.body);

            return res.status(200).json({

                success: true,

                message: "Ruta actualizada correctamente",

                data: route

            });

        } catch (error: any) {

            return res.status(400).json({

                success: false,

                message: error.message

            });

        }

    }

    async delete(req: Request, res: Response) {
        try {
            const id = Number(req.params.id);
            const result = await routeService.delete(id);
            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
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
     *   &destino_nombre=  (optional, max 150)
     *   &destino_direccion=  (optional, max 255)
     *   &place_id=  (optional, max 255)
     *
     * Returns 422 when:
     *   - Required origin fields are missing or out of range
     *   - Neither destino_id nor (destino_lat + destino_lng) are provided
     *   - Both modalities are mixed together
     */
    async trazarRuta(req: Request, res: Response) {
        // ── 1. Validate & parse query params via Zod ──────────────────────
        const parsed = traceRouteQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            return res.status(422).json({
                success: false,
                message: "Parámetros de consulta inválidos",
                errors: parsed.error.format(),
            });
        }

        const data = parsed.data;

        // ── 2. Construct strongly-typed TraceRouteParams object ───────────
        const traceParams: TraceRouteParams = {
            origin: {
                lat: data.origen_lat,
                lng: data.origen_lng,
            },
            destination:
                data.destino_id !== undefined
                    ? {
                          type: "REGISTERED",
                          id: data.destino_id,
                      }
                    : {
                          type: "EXTERNAL",
                          lat: data.destino_lat!,
                          lng: data.destino_lng!,
                          name: data.destino_nombre,
                          address: data.destino_direccion,
                          placeId: data.place_id,
                      },
        };

        // ── 3. Delegate to service ─────────────────────────────────────────
        try {
            const result = await routeService.trazarRuta(traceParams);
            return res.status(200).json({ success: true, data: result });
        } catch (error: any) {
            const status = error.message === "Destino no encontrado"
                ? 404
                : error.message?.includes("no está configurado")
                    ? 503
                    : error.message?.includes("Google Routes")
                        ? 502
                        : 500;
            return res.status(status).json({ success: false, message: error.message });
        }
    }
}

export default new RouteController();

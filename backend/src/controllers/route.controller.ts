import { Request, Response } from "express";
import routeService from "../services/route.service.js";
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

            return res.status(404).json({

                success: false,

                message: error.message

            });

        }

    }

    async trazarRuta(req: Request, res: Response) {
        try {
            const parsed = traceRouteQuerySchema.safeParse(req.query);
            if (!parsed.success) {
                return res.status(422).json({
                    success: false,
                    message: "Parámetros geográficos inválidos",
                    errors: parsed.error.issues
                });
            }

            const result = await routeService.trazarRuta(
                parsed.data.origen_lat,
                parsed.data.origen_lng,
                parsed.data.destino_id
            );
            return res.status(200).json({ success: true, data: result });
        } catch (error: any) {
            const status = error.message === "Destino no encontrado" ? 404 : 500;
            return res.status(status).json({ success: false, message: error.message });
        }
    }

}

export default new RouteController();

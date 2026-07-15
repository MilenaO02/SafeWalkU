import { Request, Response } from "express";
import routeService from "../services/route.service";

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

            const id = await routeService.create(req.body);

            return res.status(201).json({

                success: true,

                message: "Ruta creada correctamente",

                id

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
            const origen_lat = Number(req.query.origen_lat);
            const origen_lng = Number(req.query.origen_lng);
            const destino_id = Number(req.query.destino_id);
            
            if (!origen_lat || !origen_lng || !destino_id) {
                return res.status(400).json({ success: false, message: "Faltan parámetros de origen o destino" });
            }
            
            const result = await routeService.trazarRuta(origen_lat, origen_lng, destino_id);
            return res.status(200).json({ success: true, data: result });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

}

export default new RouteController();
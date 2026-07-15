import { Request, Response } from "express";
import ubicacionService from "../services/ubicacion.service";

class UbicacionController {
    async search(req: Request, res: Response) {
        try {
            const query = req.query.q as string;
            const ubicaciones = await ubicacionService.searchUbicaciones(query);
            res.json(ubicaciones);
        } catch (error) {
            res.status(500).json({ error: "Error al buscar ubicaciones" });
        }
    }
}

export default new UbicacionController();

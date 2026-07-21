import { Request, Response } from "express";
import repository from "../repositories/servicio.repository";

class ServicioController {
    async getAll(req: Request, res: Response) {
        try {
            const servicios = await repository.findAll();
            res.json({ success: true, data: servicios });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message || "Error al obtener servicios de emergencia" });
        }
    }
}

export default new ServicioController();

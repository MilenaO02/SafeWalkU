import { Request, Response } from "express";
import repository from "../repositories/lugar.repository";

class LugarController {
    async getAll(req: Request, res: Response) {
        try {
            const lugares = await repository.findAll();
            res.json({ success: true, data: lugares });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message || "Error al obtener lugares seguros" });
        }
    }
}

export default new LugarController();

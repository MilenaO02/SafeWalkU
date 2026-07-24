import { Request, Response } from "express";
import contactoService from "../services/contacto.service.js";

class ContactoController {
    async getMine(req: Request, res: Response) {
        try {
            return res.json({ success: true, data: await contactoService.getMine(req.user!.id_usuario) });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async create(req: Request, res: Response) {
        try {
            const contact = await contactoService.create(req.body, req.user!.id_usuario);
            return res.status(201).json({ success: true, message: "Contacto registrado", data: contact });
        } catch (error: any) {
            return res.status(400).json({ success: false, message: error.message });
        }
    }

    async update(req: Request, res: Response) {
        try {
            const contact = await contactoService.update(Number(req.params.id), req.body, req.user!.id_usuario);
            return res.json({ success: true, message: "Contacto actualizado", data: contact });
        } catch (error: any) {
            const status = error.message.includes("ajeno") ? 403 : 404;
            return res.status(status).json({ success: false, message: error.message });
        }
    }

    async delete(req: Request, res: Response) {
        try {
            await contactoService.delete(Number(req.params.id), req.user!.id_usuario);
            return res.json({ success: true, message: "Contacto eliminado exitosamente" });
        } catch (error: any) {
            const status = error.message.includes("ajeno") ? 403 : 404;
            return res.status(status).json({ success: false, message: error.message });
        }
    }
}

export default new ContactoController();

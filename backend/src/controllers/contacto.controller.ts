import { Request, Response } from "express";
import repository from "../repositories/contacto.repository";

class ContactoController {
    async getMyContacts(req: Request, res: Response) {
        try {
            const id_usuario = (req as any).user?.id_usuario || Number(req.params.userId);
            if (!id_usuario) {
                return res.status(400).json({ success: false, message: "ID de usuario no proporcionado" });
            }
            const contactos = await repository.findByUserId(id_usuario);
            res.json({ success: true, data: contactos });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message || "Error al obtener contactos" });
        }
    }

    async create(req: Request, res: Response) {
        try {
            const id_usuario = (req as any).user?.id_usuario || req.body.id_usuario;
            const { nombre, telefono, parentesco } = req.body;
            if (!nombre || !telefono || !parentesco || !id_usuario) {
                return res.status(400).json({ success: false, message: "Faltan datos obligatorios" });
            }
            const id = await repository.create({ nombre, telefono, parentesco, id_usuario });
            res.status(201).json({ success: true, message: "Contacto registrado", data: { id_contacto: id, nombre, telefono, parentesco } });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message || "Error al registrar contacto" });
        }
    }

    async delete(req: Request, res: Response) {
        try {
            const id = Number(req.params.id);
            await repository.delete(id);
            res.json({ success: true, message: "Contacto eliminado exitosamente" });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message || "Error al eliminar contacto" });
        }
    }
}

export default new ContactoController();

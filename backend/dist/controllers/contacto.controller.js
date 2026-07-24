"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const contacto_repository_1 = __importDefault(require("../repositories/contacto.repository"));
class ContactoController {
    async getMyContacts(req, res) {
        try {
            const id_usuario = req.user?.id_usuario || Number(req.params.userId);
            if (!id_usuario) {
                return res.status(400).json({ success: false, message: "ID de usuario no proporcionado" });
            }
            const contactos = await contacto_repository_1.default.findByUserId(id_usuario);
            res.json({ success: true, data: contactos });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message || "Error al obtener contactos" });
        }
    }
    async create(req, res) {
        try {
            const id_usuario = req.user?.id_usuario || req.body.id_usuario;
            const { nombre, telefono, parentesco } = req.body;
            if (!nombre || !telefono || !parentesco || !id_usuario) {
                return res.status(400).json({ success: false, message: "Faltan datos obligatorios" });
            }
            const id = await contacto_repository_1.default.create({ nombre, telefono, parentesco, id_usuario });
            res.status(201).json({ success: true, message: "Contacto registrado", data: { id_contacto: id, nombre, telefono, parentesco } });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message || "Error al registrar contacto" });
        }
    }
    async delete(req, res) {
        try {
            const id = Number(req.params.id);
            await contacto_repository_1.default.delete(id);
            res.json({ success: true, message: "Contacto eliminado exitosamente" });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message || "Error al eliminar contacto" });
        }
    }
}
exports.default = new ContactoController();

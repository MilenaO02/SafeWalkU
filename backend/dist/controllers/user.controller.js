"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_service_1 = __importDefault(require("../services/user.service"));
class UserController {
    async getAll(req, res) {
        const usuarios = await user_service_1.default.getAll();
        res.json(usuarios);
    }
    async getById(req, res) {
        const usuario = await user_service_1.default.getById(Number(req.params.id));
        if (!usuario) {
            return res.status(404).json({
                message: "Usuario no encontrado"
            });
        }
        res.json(usuario);
    }
    async update(req, res) {
        await user_service_1.default.update(Number(req.params.id), req.body);
        res.json({
            message: "Usuario actualizado correctamente"
        });
    }
    async updateMe(req, res) {
        try {
            const id = req.user.id_usuario;
            const updateData = {};
            if (req.body.name) {
                const parts = req.body.name.split(' ');
                updateData.nombre = parts[0];
                updateData.apellido = parts.slice(1).join(' ');
            }
            if (req.body.email) {
                updateData.correo = req.body.email;
            }
            if (req.body.nombre)
                updateData.nombre = req.body.nombre;
            if (req.body.apellido)
                updateData.apellido = req.body.apellido;
            if (req.body.correo)
                updateData.correo = req.body.correo;
            await user_service_1.default.update(id, updateData);
            res.json({ success: true, message: "Perfil actualizado correctamente" });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async delete(req, res) {
        await user_service_1.default.delete(Number(req.params.id));
        res.json({
            success: true,
            message: "Usuario desactivado correctamente"
        });
    }
    async uploadFoto(req, res) {
        try {
            const id = Number(req.params.id);
            if (!req.file) {
                return res.status(400).json({ success: false, message: "No se recibió ningún archivo." });
            }
            // Usar ruta relativa para evitar errores de Mixed Content en HTTPS
            const foto_url = `/uploads/${req.file.filename}`;
            const usuario = await user_service_1.default.updateFotoPerfil(id, foto_url);
            res.json({ success: true, data: usuario, foto_url });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.default = new UserController();

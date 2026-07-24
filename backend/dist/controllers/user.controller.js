import service from "../services/user.service.js";
import fs from "fs";
import { hasValidImageSignature } from "../config/multer.js";
class UserController {
    async getMe(req, res) {
        const usuario = await service.getById(req.user.id_usuario);
        return res.json({ success: true, data: usuario });
    }
    async getAll(req, res) {
        const usuarios = await service.getAll();
        res.json(usuarios);
    }
    async getById(req, res) {
        const usuario = await service.getById(Number(req.params.id));
        if (!usuario) {
            return res.status(404).json({
                message: "Usuario no encontrado"
            });
        }
        res.json(usuario);
    }
    async update(req, res) {
        await service.update(Number(req.params.id), req.body);
        res.json({
            message: "Usuario actualizado correctamente"
        });
    }
    async updateMe(req, res) {
        try {
            const id = req.user.id_usuario;
            const usuario = await service.update(id, req.body);
            res.json({ success: true, message: "Perfil actualizado correctamente", data: usuario });
        }
        catch (error) {
            const status = error.message === "Correo ya registrado" ? 409 : 400;
            res.status(status).json({ success: false, message: error.message });
        }
    }
    async delete(req, res) {
        await service.delete(Number(req.params.id));
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
            if (!await hasValidImageSignature(req.file.path, req.file.mimetype)) {
                await fs.promises.unlink(req.file.path);
                return res.status(400).json({ success: false, message: "El contenido del archivo no corresponde a una imagen válida." });
            }
            // Usar ruta relativa para evitar errores de Mixed Content en HTTPS
            const foto_url = `/uploads/${req.file.filename}`;
            const usuario = await service.updateFotoPerfil(id, foto_url);
            res.json({ success: true, data: usuario, foto_url });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
export default new UserController();

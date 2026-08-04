import service from "../services/user.service.js";
import fs from "fs";
import { hasValidImageSignature } from "../config/multer.js";
class UserController {
    async getMe(req, res) {
        const usuario = await service.getById(req.user.id_usuario);
        return res.json({
            success: true,
            data: {
                ...usuario,
                rol: req.user.rol,
                roles: req.user.roles
            }
        });
    }
    async getAll(req, res) {
        try {
            const usuarios = await service.getAll();
            return res.status(200).json({ success: true, data: usuarios });
        }
        catch (error) {
            console.error("No fue posible consultar los usuarios:", error);
            return res.status(500).json({
                success: false,
                message: "No fue posible consultar los usuarios"
            });
        }
    }
    async getById(req, res) {
        try {
            const id = Number(req.params.id);
            if (!Number.isInteger(id) || id < 1) {
                return res.status(400).json({ success: false, message: "ID de usuario inválido" });
            }
            const usuario = await service.getById(id);
            if (!usuario) {
                return res.status(404).json({ success: false, message: "Usuario no encontrado" });
            }
            return res.status(200).json({ success: true, data: usuario });
        }
        catch (error) {
            console.error("No fue posible consultar el usuario:", error);
            return res.status(500).json({
                success: false,
                message: "No fue posible consultar el usuario"
            });
        }
    }
    async update(req, res) {
        try {
            const id = Number(req.params.id);
            if (!Number.isInteger(id) || id < 1) {
                return res.status(400).json({ success: false, message: "ID de usuario inválido" });
            }
            const usuario = await service.update(id, req.body);
            return res.status(200).json({
                success: true,
                message: "Usuario actualizado correctamente",
                data: usuario
            });
        }
        catch (error) {
            const status = error.message === "Usuario no encontrado"
                ? 404
                : error.message === "Correo ya registrado" ? 409 : 400;
            return res.status(status).json({
                success: false,
                message: error.message || "No fue posible actualizar el usuario"
            });
        }
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
        try {
            const id = Number(req.params.id);
            if (!Number.isInteger(id) || id < 1) {
                return res.status(400).json({ success: false, message: "ID de usuario inválido" });
            }
            if (id === req.user.id_usuario) {
                return res.status(409).json({
                    success: false,
                    message: "No puede desactivar la cuenta de la sesión actual"
                });
            }
            const deleted = await service.delete(id);
            if (!deleted) {
                return res.status(404).json({ success: false, message: "Usuario no encontrado" });
            }
            return res.status(200).json({
                success: true,
                message: "Usuario desactivado correctamente"
            });
        }
        catch (error) {
            console.error("No fue posible desactivar el usuario:", error);
            return res.status(500).json({
                success: false,
                message: "No fue posible desactivar el usuario"
            });
        }
    }
    async reactivate(req, res) {
        try {
            const id = Number(req.params.id);
            if (!Number.isInteger(id) || id < 1) {
                return res.status(400).json({ success: false, message: "ID de usuario inválido" });
            }
            const reactivated = await service.reactivate(id);
            if (!reactivated) {
                return res.status(404).json({ success: false, message: "Usuario inactivo no encontrado" });
            }
            return res.status(200).json({
                success: true,
                message: "Usuario reactivado correctamente"
            });
        }
        catch (error) {
            console.error("No fue posible reactivar el usuario:", error);
            return res.status(500).json({
                success: false,
                message: "No fue posible reactivar el usuario"
            });
        }
    }
    async updateAdministratorRole(req, res) {
        try {
            const id = Number(req.params.id);
            if (!Number.isInteger(id) || id < 1) {
                return res.status(400).json({ success: false, message: "ID de usuario inválido" });
            }
            const usuario = await service.updateAdministratorRole(id, req.body.rol, req.user.id_usuario);
            return res.status(200).json({
                success: true,
                message: req.body.rol === "ADMINISTRADOR"
                    ? "Usuario convertido en administrador correctamente"
                    : "Privilegios de administrador retirados correctamente",
                data: usuario
            });
        }
        catch (error) {
            const message = error.message || "No fue posible actualizar los privilegios";
            const status = message === "Usuario activo no encontrado" ? 404
                : [
                    "El usuario ya es administrador",
                    "El usuario no es administrador",
                    "Debe existir al menos un administrador activo",
                    "No puede retirar sus propios privilegios desde la sesión actual"
                ].includes(message) ? 409 : 500;
            return res.status(status).json({ success: false, message });
        }
    }
    async uploadFoto(req, res) {
        try {
            const id = Number(req.params.id);
            if (!Number.isInteger(id) || id < 1) {
                if (req.file)
                    await fs.promises.unlink(req.file.path).catch(() => undefined);
                return res.status(400).json({ success: false, message: "ID de usuario inválido" });
            }
            if (!req.file) {
                return res.status(400).json({ success: false, message: "No se recibió ningún archivo." });
            }
            if (!await hasValidImageSignature(req.file.path, req.file.mimetype)) {
                await fs.promises.unlink(req.file.path);
                return res.status(400).json({ success: false, message: "El contenido del archivo no corresponde a una imagen válida." });
            }
            const currentUser = await service.getById(id);
            if (!currentUser) {
                await fs.promises.unlink(req.file.path).catch(() => undefined);
                return res.status(404).json({ success: false, message: "Usuario no encontrado" });
            }
            // Usar ruta relativa para evitar errores de Mixed Content en HTTPS
            const foto_url = `/uploads/${req.file.filename}`;
            const usuario = await service.updateFotoPerfil(id, foto_url);
            if (currentUser.foto_perfil?.startsWith("/uploads/perfil-") && currentUser.foto_perfil !== foto_url) {
                const previousPath = currentUser.foto_perfil.replace(/^\/uploads\//, "");
                await fs.promises.unlink(`uploads/${previousPath}`).catch(() => undefined);
            }
            res.json({ success: true, data: usuario, foto_url });
        }
        catch (error) {
            if (req.file)
                await fs.promises.unlink(req.file.path).catch(() => undefined);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async deleteFoto(req, res) {
        try {
            const id = Number(req.params.id);
            if (!Number.isInteger(id) || id < 1) {
                return res.status(400).json({ success: false, message: "ID de usuario inválido" });
            }
            const currentUser = await service.getById(id);
            if (!currentUser) {
                return res.status(404).json({ success: false, message: "Usuario no encontrado" });
            }
            const usuario = await service.updateFotoPerfil(id, null);
            if (currentUser.foto_perfil?.startsWith("/uploads/perfil-")) {
                const previousPath = currentUser.foto_perfil.replace(/^\/uploads\//, "");
                await fs.promises.unlink(`uploads/${previousPath}`).catch(() => undefined);
            }
            return res.status(200).json({ success: true, message: "Foto de perfil eliminada.", data: usuario });
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message || "No fue posible eliminar la foto de perfil." });
        }
    }
}
export default new UserController();

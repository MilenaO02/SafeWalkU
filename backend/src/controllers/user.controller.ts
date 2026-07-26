import { Request, Response } from "express";

import service from "../services/user.service.js";
import fs from "fs";
import { hasValidImageSignature } from "../config/multer.js";

class UserController {

    async getMe(req: Request, res: Response) {
        const usuario = await service.getById(req.user!.id_usuario);
        return res.json({
            success: true,
            data: {
                ...usuario,
                rol: req.user!.rol,
                roles: req.user!.roles
            }
        });
    }

    async getAll(req: Request, res: Response) {
        try {
            const usuarios = await service.getAll();
            return res.status(200).json({ success: true, data: usuarios });
        } catch (error) {
            console.error("No fue posible consultar los usuarios:", error);
            return res.status(500).json({
                success: false,
                message: "No fue posible consultar los usuarios"
            });
        }

    }

    async getById(req: Request, res: Response) {
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
        } catch (error) {
            console.error("No fue posible consultar el usuario:", error);
            return res.status(500).json({
                success: false,
                message: "No fue posible consultar el usuario"
            });
        }

    }

    async update(req: Request, res: Response) {
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
        } catch (error: any) {
            const status = error.message === "Usuario no encontrado"
                ? 404
                : error.message === "Correo ya registrado" ? 409 : 400;
            return res.status(status).json({
                success: false,
                message: error.message || "No fue posible actualizar el usuario"
            });
        }

    }

    async updateMe(req: Request, res: Response) {
        try {
            const id = req.user!.id_usuario;
            const usuario = await service.update(id, req.body);

            res.json({ success: true, message: "Perfil actualizado correctamente", data: usuario });
        } catch (error: any) {
            const status = error.message === "Correo ya registrado" ? 409 : 400;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    async delete(req: Request, res: Response) {
        try {
            const id = Number(req.params.id);
            if (!Number.isInteger(id) || id < 1) {
                return res.status(400).json({ success: false, message: "ID de usuario inválido" });
            }

            if (id === req.user!.id_usuario) {
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
                success:true,
                message: "Usuario desactivado correctamente"
            });
        } catch (error) {
            console.error("No fue posible desactivar el usuario:", error);
            return res.status(500).json({
                success: false,
                message: "No fue posible desactivar el usuario"
            });
        }

    }

    async uploadFoto(req: Request, res: Response) {

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

        } catch (error: any) {

            res.status(500).json({ success: false, message: error.message });

        }

    }

}

export default new UserController();

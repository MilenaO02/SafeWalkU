import { Request, Response } from "express";
import service from "../services/auth.service";

class AuthController {
    async register(req: Request, res: Response) {
        try {
            const resultado = await service.register(req.body);
            res.status(201).json({
                success: true,
                message: "Usuario registrado exitosamente",
                data: resultado,
                id: resultado.id,
                correo: resultado.correo
            });
        } catch (error: any) {
            const status = error.message?.includes("ya registrado") ? 409 : 400;
            res.status(status).json({
                success: false,
                message: error.message || "Error en el registro",
                errors: [error.message]
            });
        }
    }

    async login(req: Request, res: Response) {
        try {
            const correo = req.body.correo ?? req.body.email;
            const contrasena = req.body.contrasena ?? req.body.password;

            const resultado = await service.login(correo, contrasena);
            res.status(200).json({
                success: true,
                message: "Inicio de sesión exitoso",
                data: resultado,
                token: resultado.token,
                usuario: resultado.usuario
            });
        } catch (error: any) {
            const status = error.message?.includes("no encontrado") ? 404 : 401;
            res.status(status).json({
                success: false,
                message: error.message || "Credenciales inválidas",
                errors: [error.message]
            });
        }
    }
}

export default new AuthController();
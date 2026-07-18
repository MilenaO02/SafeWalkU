import { Request, Response } from "express";

import service from "../services/auth.service";

class AuthController {
    async register(req: Request, res: Response) {
        try {
            const resultado = await service.register(req.body);
            res.status(201).json(resultado);
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message || 'Error en registro' });
        }
    }

    async login(req: Request, res: Response) {
        try {
            const correo = req.body.correo ?? req.body.email;
            const contrasena = req.body.contrasena ?? req.body.password;

            const resultado = await service.login(correo, contrasena);
            res.json(resultado);
        } catch (error: any) {
            res.status(401).json({ success: false, message: error.message || 'Credenciales inválidas' });
        }
    }
}

export default new AuthController();
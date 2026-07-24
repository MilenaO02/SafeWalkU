"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_service_1 = __importDefault(require("../services/auth.service"));
class AuthController {
    async register(req, res) {
        try {
            const resultado = await auth_service_1.default.register(req.body);
            res.status(201).json({
                success: true,
                message: "Usuario registrado correctamente",
                data: {
                    id_usuario: resultado.id,
                    correo: resultado.correo
                }
            });
        }
        catch (error) {
            const status = error.message?.includes("ya registrado") ? 409 : 400;
            res.status(status).json({
                success: false,
                message: error.message || "Error en el registro",
                errors: [error.message]
            });
        }
    }
    async login(req, res) {
        try {
            const correo = req.body.correo ?? req.body.email;
            const contrasena = req.body.contrasena ?? req.body.password;
            const resultado = await auth_service_1.default.login(correo, contrasena);
            // token y usuario en la raíz para compatibilidad con el frontend
            res.status(200).json({
                success: true,
                message: "Inicio de sesión correcto",
                token: resultado.token,
                usuario: resultado.usuario,
                data: resultado
            });
        }
        catch (error) {
            // 401 para cualquier error de credenciales (no exponer si el usuario existe o no)
            res.status(401).json({
                success: false,
                message: error.message || "Credenciales incorrectas"
            });
        }
    }
}
exports.default = new AuthController();

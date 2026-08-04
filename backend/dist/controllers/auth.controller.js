import service, { InvalidCredentialsError, InvalidSessionError, RoleNotAllowedError, PasswordResetUnavailableError, InvalidPasswordResetTokenError } from "../services/auth.service.js";
class AuthController {
    async register(req, res) {
        try {
            const resultado = await service.register(req.body);
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
            const resultado = await service.login(correo, contrasena);
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
            if (error instanceof InvalidCredentialsError) {
                return res.status(401).json({
                    success: false,
                    message: "Credenciales incorrectas"
                });
            }
            console.error("Error interno durante el login:", error);
            return res.status(500).json({
                success: false,
                message: "Error interno del servidor"
            });
        }
    }
    async switchRole(req, res) {
        try {
            const resultado = await service.switchRole(req.user.id_usuario, req.body.rol);
            return res.status(200).json({
                success: true,
                message: `Modo ${req.body.rol.toLowerCase()} activado`,
                token: resultado.token,
                usuario: resultado.usuario,
                data: resultado
            });
        }
        catch (error) {
            if (error instanceof RoleNotAllowedError) {
                return res.status(403).json({ success: false, message: error.message });
            }
            if (error instanceof InvalidSessionError) {
                return res.status(401).json({ success: false, message: error.message });
            }
            console.error("Error interno al cambiar el modo de acceso:", error);
            return res.status(500).json({
                success: false,
                message: "No fue posible cambiar el modo de acceso"
            });
        }
    }
    async requestPasswordReset(req, res) {
        try {
            await service.requestPasswordReset(req.body.correo);
            return res.status(200).json({
                success: true,
                message: "Si la cuenta existe, recibiras un enlace de recuperacion en tu correo institucional."
            });
        }
        catch (error) {
            if (error instanceof PasswordResetUnavailableError) {
                return res.status(503).json({ success: false, message: error.message });
            }
            console.error("Error al solicitar recuperacion de contrasena:", error);
            return res.status(500).json({ success: false, message: "No fue posible procesar la solicitud" });
        }
    }
    async confirmPasswordReset(req, res) {
        try {
            await service.confirmPasswordReset(req.body.token, req.body.contrasena);
            return res.status(200).json({ success: true, message: "Contrasena actualizada correctamente. Ya puedes iniciar sesion." });
        }
        catch (error) {
            if (error instanceof InvalidPasswordResetTokenError) {
                return res.status(400).json({ success: false, message: error.message });
            }
            console.error("Error al restablecer contrasena:", error);
            return res.status(500).json({ success: false, message: "No fue posible actualizar la contrasena" });
        }
    }
}
export default new AuthController();

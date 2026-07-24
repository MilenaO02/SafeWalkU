import jwt from "jsonwebtoken";
import userService from "../services/user.service.js";
import { getJwtSecret } from "../config/security.js";
export default async function auth(req, res, next) {
    const match = req.headers.authorization?.match(/^Bearer\s+(.+)$/i);
    if (!match) {
        return res.status(401).json({ success: false, message: "Token no enviado o formato inválido." });
    }
    let jwtSecret;
    try {
        jwtSecret = getJwtSecret();
    }
    catch {
        return res.status(500).json({ success: false, message: "Configuración de autenticación incompleta." });
    }
    try {
        const decoded = jwt.verify(match[1], jwtSecret, {
            algorithms: ["HS256"]
        });
        const idUsuario = Number(decoded.id_usuario);
        if (!Number.isInteger(idUsuario) || idUsuario < 1) {
            throw new Error("Identificador de sesión inválido");
        }
        // La base de datos es la fuente actual del estado y el rol. De este modo,
        // desactivar una cuenta invalida también sus tokens todavía no vencidos.
        const usuario = await userService.getById(idUsuario);
        if (!usuario || usuario.estado !== "ACTIVO") {
            return res.status(401).json({ success: false, message: "Sesión no válida." });
        }
        req.user = {
            id_usuario: usuario.id_usuario,
            correo: usuario.correo,
            rol: usuario.rol
        };
        next();
    }
    catch {
        return res.status(401).json({ success: false, message: "Token inválido o vencido." });
    }
}

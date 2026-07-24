import userService from "../services/user.service.js";
export default async function authorizeSelfOrAdmin(req, res, next) {
    const requestedId = Number(req.params.id);
    if (!Number.isInteger(requestedId) || requestedId < 1) {
        return res.status(400).json({ success: false, message: "ID de usuario inválido." });
    }
    if (req.user?.rol !== "ADMINISTRADOR" && req.user?.id_usuario !== requestedId) {
        return res.status(403).json({ success: false, message: "No puede modificar recursos de otro usuario." });
    }
    const targetUser = await userService.getById(requestedId);
    if (!targetUser) {
        return res.status(404).json({ success: false, message: "Usuario no encontrado." });
    }
    return next();
}

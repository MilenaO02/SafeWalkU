function normalizeRole(role) {
    const value = role?.toString().toUpperCase() ?? "";
    if (value === "ADMIN" || value === "ADMINISTRADOR") {
        return "ADMINISTRADOR";
    }
    if (value === "ESTUDIANTE" || value === "STUDENT") {
        return "ESTUDIANTE";
    }
    return value;
}
export default function authorize(...roles) {
    const allowedRoles = roles.map(normalizeRole);
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                message: "No autenticado."
            });
        }
        if (!allowedRoles.includes(normalizeRole(req.user.rol))) {
            return res.status(403).json({
                message: "No tiene permisos."
            });
        }
        next();
    };
}

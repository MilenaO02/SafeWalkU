import { Request, Response, NextFunction } from "express";

function normalizeRole(role?: string) {
    const value = role?.toString().toUpperCase() ?? "";

    if (value === "ADMIN" || value === "ADMINISTRADOR") {
        return "ADMINISTRADOR";
    }

    if (value === "ESTUDIANTE" || value === "STUDENT") {
        return "ESTUDIANTE";
    }

    return value;
}

export default function authorize(...roles: string[]) {
    const allowedRoles = roles.map(normalizeRole);

    return (req: Request, res: Response, next: NextFunction) => {
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
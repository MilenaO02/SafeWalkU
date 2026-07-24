"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidUideEmail = isValidUideEmail;
exports.default = validateDomain;
function isValidUideEmail(correo) {
    return /^[^\s@]+@uide\.edu\.ec$/i.test(correo ?? "");
}
function validateDomain(req, res, next) {
    const correo = (req.body?.correo ?? req.body?.email ?? "").toString().trim().toLowerCase();
    if (!isValidUideEmail(correo)) {
        return res.status(400).json({
            message: "Solo se permiten correos institucionales con dominio @uide.edu.ec"
        });
    }
    req.body.correo = correo;
    next();
}

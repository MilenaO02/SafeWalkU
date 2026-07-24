function isValidUideEmail(correo) {
    return /^[^\s@]+@uide\.edu\.ec$/i.test(correo ?? "");
}
export { isValidUideEmail };
export default function validateDomain(req, res, next) {
    const correo = (req.body?.correo ?? req.body?.email ?? "").toString().trim().toLowerCase();
    if (!isValidUideEmail(correo)) {
        return res.status(400).json({
            message: "Solo se permiten correos institucionales con dominio @uide.edu.ec"
        });
    }
    req.body.correo = correo;
    next();
}

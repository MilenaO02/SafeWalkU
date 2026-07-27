import rateLimit from "express-rate-limit";
const authRateLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 10,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Demasiados intentos de autenticación. Intente nuevamente en unos minutos."
    }
});
export default authRateLimiter;

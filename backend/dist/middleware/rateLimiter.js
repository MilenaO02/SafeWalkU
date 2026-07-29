import rateLimit from "express-rate-limit";
/**
 * Global rate limiter — generous enough for normal authenticated usage.
 * Applies to all /api/* endpoints EXCEPT auth routes (which have their own
 * stricter limiter applied at the route level).
 *
 * 300 requests per 15 minutes per IP is comfortable for a single-page app
 * that fetches dashboard data, reports, routes, etc.
 */
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Demasiadas solicitudes. Por favor espera unos minutos antes de intentar nuevamente.",
    },
});
/**
 * Health endpoint — very generous since it's called on every login page load.
 */
export const healthLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Demasiadas consultas al estado del servicio.",
    },
});
export default globalLimiter;

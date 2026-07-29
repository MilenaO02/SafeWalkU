import rateLimit from "express-rate-limit";

/**
 * Auth rate limiter — stricter limit for login/register.
 * - Only counts FAILED requests (skipSuccessfulRequests: true)
 * - 10 failed attempts per 5 minutes per IP
 * - A successful login resets the counter automatically
 * - Uses standardHeaders so the client can read Retry-After
 */
const authRateLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 10,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Demasiados intentos de autenticación. Intente nuevamente en unos minutos.",
        retryAfterSeconds: 300,
    },
});

export default authRateLimiter;

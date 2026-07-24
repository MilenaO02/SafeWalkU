import rateLimit from "express-rate-limit";
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        message: "Demasiadas solicitudes."
    }
});
export default limiter;

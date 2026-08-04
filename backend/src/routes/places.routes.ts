import { Router } from "express";
import controller from "../controllers/places.controller.js";
import rateLimit from "express-rate-limit";

/**
 * Server-side proxy for Google Places (New) API.
 * Keeps the API key out of the browser network tab.
 */

// Separate, more generous rate limit for autocomplete (typing triggers many calls)
const placesLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60,             // 60 autocomplete calls per minute per IP
    message: { success: false, message: "Demasiadas búsquedas. Aguarda un momento." }
});

const router = Router();

// Public autocomplete/details keep the API key server-side and are protected by rate limit.
router.post("/autocomplete", placesLimiter, controller.autocomplete);
router.post("/details", placesLimiter, controller.details);

export default router;

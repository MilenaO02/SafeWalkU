import { Router } from "express";
import controller from "../controllers/places.controller.js";
import auth from "../middleware/auth.js";
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

// All routes require authentication so anonymous users can't use the proxy
router.post("/autocomplete", auth, placesLimiter, controller.autocomplete);
router.get("/details/*", auth, placesLimiter, controller.details);

export default router;

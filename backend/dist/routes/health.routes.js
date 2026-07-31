import { Router } from "express";
import pool from "../config/database.js";
import { healthLimiter } from "../middleware/rateLimiter.js";
const router = Router();
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Estado de la API y Base de Datos
 *     tags:
 *       - General
 *     responses:
 *       200:
 *         description: API y BD conectadas correctamente
 *       500:
 *         description: Error de conexión a la base de datos
 */
router.get("/health", healthLimiter, async (req, res) => {
    try {
        await pool.query("SELECT 1");
        return res.status(200).json({
            success: true,
            api: "online",
            database: "connected",
            checkedAt: new Date().toISOString()
        });
    }
    catch (error) {
        console.error("Healthcheck DB Error:", error);
        return res.status(503).json({
            success: false,
            api: "online",
            database: "disconnected",
            message: "Error de conexión a la base de datos",
            checkedAt: new Date().toISOString()
        });
    }
});
export default router;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = __importDefault(require("../config/database"));
const router = (0, express_1.Router)();
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
router.get("/health", async (req, res) => {
    try {
        await database_1.default.query("SELECT 1");
        return res.status(200).json({
            success: true,
            api: "online",
            database: "connected"
        });
    }
    catch (error) {
        console.error("Healthcheck DB Error:", error);
        return res.status(500).json({
            success: false,
            api: "online",
            database: "disconnected",
            message: "Error de conexión a la base de datos"
        });
    }
});
exports.default = router;

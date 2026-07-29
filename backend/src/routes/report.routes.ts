import { Router } from "express";
import reportController from "../controllers/report.controller.js";

import auth from "../middleware/auth.js";
import authorize from "../middleware/authorize.js";
import validate from "../middleware/validate.js";
import rateLimit from "express-rate-limit";

import {

    createReportSchema,

    updateReportSchema,

    createSosSchema

} from "../schemas/report.schema.js";
const router = Router();
const sosLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 6,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { success: false, message: "Demasiados intentos de SOS. Si estás en peligro inmediato, llama al ECU 911." }
});

/**
 * @swagger
 * tags:
 *   name: Reportes
 *   description: Gestión de reportes de incidentes
 */

/**
 * @swagger
 * /api/reports:
 *   get:
 *     summary: Obtener todos los reportes
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de reportes
 */
router.get(
    "/",
    auth,
    reportController.getAll
);

/**
 * @swagger
 * /api/reports/{id}:
 *   get:
 *     summary: Obtener un reporte por ID
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Reporte encontrado
 *       404:
 *         description: Reporte no encontrado
 */
router.get(
    "/zonas/riesgo",
    auth,
    reportController.getRiskZones
);

router.post(
    "/sos",
    auth,
    authorize("ESTUDIANTE", "ADMINISTRADOR"),
    sosLimiter,
    validate(createSosSchema),
    reportController.createSOS
);

router.put(
    "/sos/:id/cancelar",
    auth,
    authorize("ESTUDIANTE", "ADMINISTRADOR"),
    reportController.cancelSOS
);

router.put(
    "/sos/:id/atender",
    auth,
    authorize("ADMINISTRADOR"),
    reportController.resolveSOS
);

router.get(
    "/:id",
    auth,
    reportController.getById
);

/**
 * @swagger
 * /api/reports:
 *   post:
 *     summary: Crear un reporte
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               descripcion:
 *                 type: string
 *               nivel_riesgo:
 *                 type: string
 *                 enum:
 *                   - BAJO
 *                   - MEDIO
 *                   - ALTO
 *               id_usuario:
 *                 type: integer
 *               id_ubicacion:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Reporte creado correctamente
 */
router.post(
    "/",
    auth,
    authorize("ESTUDIANTE", "ADMINISTRADOR"),
    validate(createReportSchema),
    reportController.create
);

/**
 * @swagger
 * /api/reports/{id}:
 *   put:
 *     summary: Actualizar un reporte
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               descripcion:
 *                 type: string
 *               nivel_riesgo:
 *                 type: string
 *               estado:
 *                 type: string
 *                 enum:
 *                   - PENDIENTE
 *                   - VALIDADO
 *                   - RECHAZADO
 *                   - DUPLICADO
 *     responses:
 *       200:
 *         description: Reporte actualizado correctamente
 */
router.put(
    "/:id",
    auth,
    authorize("ADMINISTRADOR"),
    validate(updateReportSchema),
    reportController.update
);

/**
 * @swagger
 * /api/reports/{id}:
 *   delete:
 *     summary: Desactivar un reporte
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Reporte desactivado correctamente
 */
router.delete(
    "/:id",
    auth,
    authorize("ADMINISTRADOR"),
    reportController.delete
);

export default router;

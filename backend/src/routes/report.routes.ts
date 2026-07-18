import { Router } from "express";
import reportController from "../controllers/report.controller";

import auth from "../middleware/auth";
import authorize from "../middleware/authorize";
import validate from "../middleware/validate";

import {

    createReportSchema,

    updateReportSchema

} from "../schemas/report.schema";
const router = Router();

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

router.get(
    "/zonas/riesgo",
    auth,
    reportController.getRiskZones
);

router.post(
    "/sos",
    auth,
    authorize("ESTUDIANTE", "ADMINISTRADOR"),
    reportController.createSOS
);

router.put(
    "/sos/:id/cancelar",
    auth,
    authorize("ESTUDIANTE", "ADMINISTRADOR"),
    reportController.cancelSOS
);

export default router;
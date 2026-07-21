"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const report_controller_1 = __importDefault(require("../controllers/report.controller"));
const auth_1 = __importDefault(require("../middleware/auth"));
const authorize_1 = __importDefault(require("../middleware/authorize"));
const router = (0, express_1.Router)();
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
router.get("/", auth_1.default, report_controller_1.default.getAll);
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
router.get("/:id", auth_1.default, report_controller_1.default.getById);
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
router.post("/", auth_1.default, (0, authorize_1.default)("ESTUDIANTE", "ADMINISTRADOR"), report_controller_1.default.create);
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
router.put("/:id", auth_1.default, (0, authorize_1.default)("ADMINISTRADOR"), report_controller_1.default.update);
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
router.delete("/:id", auth_1.default, (0, authorize_1.default)("ADMINISTRADOR"), report_controller_1.default.delete);
router.get("/zonas/riesgo", auth_1.default, report_controller_1.default.getRiskZones);
router.post("/sos", auth_1.default, (0, authorize_1.default)("ESTUDIANTE", "ADMINISTRADOR"), report_controller_1.default.createSOS);
router.put("/sos/:id/cancelar", auth_1.default, (0, authorize_1.default)("ESTUDIANTE", "ADMINISTRADOR"), report_controller_1.default.cancelSOS);
exports.default = router;

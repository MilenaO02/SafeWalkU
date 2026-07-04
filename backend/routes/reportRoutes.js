const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");

const controller = require("../controllers/reportController");

/**
 * @swagger
 * /api/reports:
 *   get:
 *     summary: Obtener reportes
 *     tags:
 *       - Reportes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de reportes
 */
router.get("/", auth, controller.getReports);

/**
 * @swagger
 * /api/reports:
 *   post:
 *     summary: Crear reporte
 *     tags:
 *       - Reportes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Reporte creado
 */
router.post("/", auth, controller.createReport);

/**
 * @swagger
 * /api/reports/{id}:
 *   put:
 *     summary: Actualizar reporte
 *     tags:
 *       - Reportes
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
 *         description: Reporte actualizado
 */
router.put("/:id", auth, controller.updateReport);

/**
 * @swagger
 * /api/reports/{id}:
 *   delete:
 *     summary: Eliminar reporte
 *     tags:
 *       - Reportes
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
 *         description: Reporte eliminado
 */
router.delete("/:id", auth, controller.deleteReport);

module.exports = router;
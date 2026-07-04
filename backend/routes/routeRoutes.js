const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");

const controller = require("../controllers/routeController");

/**
 * @swagger
 * /api/routes:
 *   get:
 *     summary: Obtener rutas
 *     tags:
 *       - Rutas
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de rutas
 */
router.get("/", auth, controller.getRoutes);

/**
 * @swagger
 * /api/routes:
 *   post:
 *     summary: Crear ruta
 *     tags:
 *       - Rutas
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Ruta creada
 */
router.post("/", auth, controller.createRoute);

/**
 * @swagger
 * /api/routes/{id}:
 *   put:
 *     summary: Actualizar ruta
 *     tags:
 *       - Rutas
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
 *         description: Ruta actualizada
 */
router.put("/:id", auth, controller.updateRoute);

/**
 * @swagger
 * /api/routes/{id}:
 *   delete:
 *     summary: Eliminar ruta
 *     tags:
 *       - Rutas
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
 *         description: Ruta eliminada
 */
router.delete("/:id", auth, controller.deleteRoute);

module.exports = router;
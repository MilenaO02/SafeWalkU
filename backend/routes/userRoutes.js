const express = require("express");
const { body } = require("express-validator");

const router = express.Router();

const auth = require("../middleware/auth");
const controller = require("../controllers/userController");
const { validate } = require("../middleware/validator");

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Obtener usuarios
 *     tags:
 *       - Usuarios
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios
 */
router.get("/", auth, controller.getUsers);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Crear usuario
 *     tags:
 *       - Usuarios
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               apellido:
 *                 type: string
 *               correo:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuario creado correctamente
 */
router.post(
    "/",
    auth,
    body("nombre").notEmpty().withMessage("El nombre es obligatorio"),
    body("apellido").notEmpty().withMessage("El apellido es obligatorio"),
    body("correo").isEmail().withMessage("Correo inválido"),
    validate,
    controller.createUser
);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Actualizar usuario
 *     tags:
 *       - Usuarios
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
 *               nombre:
 *                 type: string
 *               apellido:
 *                 type: string
 *               correo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuario actualizado correctamente
 *       404:
 *         description: Usuario no encontrado
 */
router.put("/:id", auth, controller.updateUser);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Eliminar usuario
 *     tags:
 *       - Usuarios
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
 *         description: Usuario eliminado correctamente
 *       404:
 *         description: Usuario no encontrado
 */
router.delete("/:id", auth, controller.deleteUser);

module.exports = router;
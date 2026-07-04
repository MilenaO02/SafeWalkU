





const express = require("express");
const { body } = require("express-validator");

const router = express.Router();

const authController = require("../controllers/authController");

const { validate } = require("../middleware/validator");

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar un usuario
 *     tags:
 *       - Autenticación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuario registrado correctamente
 */

router.post(
    "/register",

    body("name").notEmpty(),

    body("email").isEmail(),

    body("password").isLength({ min: 6 }),

    validate,

    authController.register
);

router.post(

    /**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags:
 *       - Autenticación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso
 */
    "/login",

    body("email").isEmail(),

    body("password").notEmpty(),

    validate,

    authController.login

);

module.exports = router;

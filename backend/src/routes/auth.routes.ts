import { Router } from "express";

import controller from "../controllers/auth.controller.js";

import validate from "../middleware/validate.js";
import validateDomain from "../middleware/validateDomain.js";
import authRateLimiter from "../middleware/authRateLimiter.js";
import auth from "../middleware/auth.js";

import {
    registerSchema,
    loginSchema,
    passwordResetConfirmSchema,
    passwordResetRequestSchema,
    switchRoleSchema
} from "../schemas/auth.schema.js";

const router=Router();

/**
 * @swagger
 * tags:
 *  name: Auth
 *  description: Autenticación
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registrar usuario
 *     tags: [Auth]
 */

router.post(

"/register",

authRateLimiter,
validate(registerSchema),
validateDomain,
controller.register

);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login
 *     tags: [Auth]
 */

router.post(

"/login",

authRateLimiter,
validate(loginSchema),
validateDomain,
controller.login

);

router.post("/password-reset/request", authRateLimiter, validate(passwordResetRequestSchema), controller.requestPasswordReset);
router.post("/password-reset/confirm", authRateLimiter, validate(passwordResetConfirmSchema), controller.confirmPasswordReset);

/**
 * @swagger
 * /auth/switch-role:
 *   post:
 *     summary: Cambiar el modo activo de una cuenta con acceso dual
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 */
router.post(

"/switch-role",

auth,
validate(switchRoleSchema),
controller.switchRole

);

export default router;

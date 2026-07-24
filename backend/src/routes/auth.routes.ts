import { Router } from "express";

import controller from "../controllers/auth.controller.js";

import validate from "../middleware/validate.js";
import validateDomain from "../middleware/validateDomain.js";
import authRateLimiter from "../middleware/authRateLimiter.js";

import{

registerSchema,

loginSchema

}from "../schemas/auth.schema.js";

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

export default router;

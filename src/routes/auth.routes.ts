import { Router } from "express";

import controller from "../controllers/auth.controller";

import validate from "../middleware/validate";
import validateDomain from "../middleware/validateDomain";

import{

registerSchema,

loginSchema

}from "../schemas/auth.schema";

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

validate(loginSchema),
validateDomain,
controller.login

);

export default router;

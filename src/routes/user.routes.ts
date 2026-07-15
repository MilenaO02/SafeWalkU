import { Router } from "express";

import controller from "../controllers/user.controller";

import auth from "../middleware/auth";

import authorize from "../middleware/authorize";

import validate from "../middleware/validate";

import { updateUserSchema } from "../schemas/user.schema";

import upload from "../config/multer";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Usuarios
 *   description: Gestión de usuarios
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Obtener todos los usuarios
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 */
router.get(
    "/",
    auth,
    authorize("ADMINISTRADOR"),
    controller.getAll
);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Obtener usuario por ID
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 */
router.get(
    "/:id",
    auth,
    authorize("ADMINISTRADOR"),
    controller.getById
);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Actualizar usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 */
router.put(
    "/:id",
    auth,
    authorize("ADMINISTRADOR"),
    validate(updateUserSchema),
    controller.update
);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Desactivar usuario (Borrado lógico)
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
    "/:id",
    auth,
    authorize("ADMINISTRADOR"),
    controller.delete
);

/**
 * @swagger
 * /users/{id}/foto:
 *   put:
 *     summary: Subir foto de perfil del usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 */
router.put(
    "/:id/foto",
    auth,
    upload.single("imagen"),
    controller.uploadFoto
);

export default router;
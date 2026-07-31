import { Router } from "express";

import controller from "../controllers/user.controller.js";

import auth from "../middleware/auth.js";

import authorize from "../middleware/authorize.js";

import validate from "../middleware/validate.js";

import { administratorRoleSchema, updateOwnProfileSchema, updateUserSchema } from "../schemas/user.schema.js";
import authorizeSelfOrAdmin from "../middleware/authorizeSelfOrAdmin.js";

import upload from "../config/multer.js";

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

router.get(
    "/me",
    auth,
    controller.getMe
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
 * /users/me:
 *   put:
 *     summary: Actualizar mi propio perfil
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 */
router.put(
    "/me",
    auth,
    validate(updateOwnProfileSchema),
    controller.updateMe
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

router.patch(
    "/:id/reactivate",
    auth,
    authorize("ADMINISTRADOR"),
    controller.reactivate
);

router.patch(
    "/:id/administrator",
    auth,
    authorize("ADMINISTRADOR"),
    validate(administratorRoleSchema),
    controller.updateAdministratorRole
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
    authorizeSelfOrAdmin,
    upload.single("imagen"),
    controller.uploadFoto
);

export default router;

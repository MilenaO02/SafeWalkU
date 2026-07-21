"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = __importDefault(require("../controllers/user.controller"));
const auth_1 = __importDefault(require("../middleware/auth"));
const authorize_1 = __importDefault(require("../middleware/authorize"));
const validate_1 = __importDefault(require("../middleware/validate"));
const user_schema_1 = require("../schemas/user.schema");
const multer_1 = __importDefault(require("../config/multer"));
const router = (0, express_1.Router)();
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
router.get("/", auth_1.default, (0, authorize_1.default)("ADMINISTRADOR"), user_controller_1.default.getAll);
/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Obtener usuario por ID
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 */
router.get("/:id", auth_1.default, (0, authorize_1.default)("ADMINISTRADOR"), user_controller_1.default.getById);
/**
 * @swagger
 * /users/me:
 *   put:
 *     summary: Actualizar mi propio perfil
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 */
router.put("/me", auth_1.default, user_controller_1.default.updateMe);
/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Actualizar usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 */
router.put("/:id", auth_1.default, (0, authorize_1.default)("ADMINISTRADOR"), (0, validate_1.default)(user_schema_1.updateUserSchema), user_controller_1.default.update);
/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Desactivar usuario (Borrado lógico)
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 */
router.delete("/:id", auth_1.default, (0, authorize_1.default)("ADMINISTRADOR"), user_controller_1.default.delete);
/**
 * @swagger
 * /users/{id}/foto:
 *   put:
 *     summary: Subir foto de perfil del usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 */
router.put("/:id/foto", auth_1.default, multer_1.default.single("imagen"), user_controller_1.default.uploadFoto);
exports.default = router;

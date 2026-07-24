"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = __importDefault(require("../controllers/auth.controller"));
const validate_1 = __importDefault(require("../middleware/validate"));
const validateDomain_1 = __importDefault(require("../middleware/validateDomain"));
const auth_schema_1 = require("../schemas/auth.schema");
const router = (0, express_1.Router)();
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
router.post("/register", (0, validate_1.default)(auth_schema_1.registerSchema), validateDomain_1.default, auth_controller_1.default.register);
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login
 *     tags: [Auth]
 */
router.post("/login", (0, validate_1.default)(auth_schema_1.loginSchema), validateDomain_1.default, auth_controller_1.default.login);
exports.default = router;

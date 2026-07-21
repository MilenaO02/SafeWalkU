"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(2),
    apellido: zod_1.z.string().min(2),
    correo: zod_1.z.string().email(),
    contrasena: zod_1.z.string().min(6),
    rol: zod_1.z.enum([
        "ESTUDIANTE",
        "ADMINISTRADOR"
    ])
});
exports.loginSchema = zod_1.z.object({
    correo: zod_1.z.string().email(),
    contrasena: zod_1.z.string().min(6)
});

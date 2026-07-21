"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserSchema = void 0;
const zod_1 = require("zod");
exports.updateUserSchema = zod_1.z.object({
    nombre: zod_1.z.string().optional(),
    apellido: zod_1.z.string().optional(),
    correo: zod_1.z.string().email().optional(),
    rol: zod_1.z.enum([
        "ESTUDIANTE",
        "ADMINISTRADOR"
    ]).optional()
});

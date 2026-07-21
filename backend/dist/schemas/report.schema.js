"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateReportSchema = exports.createReportSchema = void 0;
const zod_1 = require("zod");
exports.createReportSchema = zod_1.z.object({
    descripcion: zod_1.z
        .string()
        .min(5, "La descripción debe tener al menos 5 caracteres")
        .max(500),
    nivel_riesgo: zod_1.z.enum([
        "BAJO",
        "MEDIO",
        "ALTO"
    ]),
    id_usuario: zod_1.z
        .number()
        .int()
        .positive(),
    id_ubicacion: zod_1.z
        .number()
        .int()
        .positive()
});
exports.updateReportSchema = zod_1.z.object({
    descripcion: zod_1.z
        .string()
        .min(5)
        .max(500),
    nivel_riesgo: zod_1.z.enum([
        "BAJO",
        "MEDIO",
        "ALTO"
    ]),
    estado: zod_1.z.enum([
        "PENDIENTE",
        "VALIDADO",
        "RECHAZADO",
        "DUPLICADO"
    ])
});

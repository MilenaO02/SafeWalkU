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
    // id_usuario viene del token JWT en el controller, no del body del request
    id_usuario: zod_1.z
        .number()
        .int()
        .positive()
        .optional(),
    id_ubicacion: zod_1.z
        .number()
        .int()
        .positive()
        .optional()
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

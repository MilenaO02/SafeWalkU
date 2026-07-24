"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateEvidenceSchema = exports.createEvidenceSchema = void 0;
const zod_1 = require("zod");
exports.createEvidenceSchema = zod_1.z.object({
    url_archivo: zod_1.z
        .string()
        .url("La URL del archivo no es válida"),
    tipo_archivo: zod_1.z.enum([
        "IMAGEN",
        "VIDEO"
    ]),
    id_reporte: zod_1.z
        .number()
        .int()
        .positive()
});
exports.updateEvidenceSchema = zod_1.z.object({
    url_archivo: zod_1.z
        .string()
        .url(),
    tipo_archivo: zod_1.z.enum([
        "IMAGEN",
        "VIDEO"
    ])
});

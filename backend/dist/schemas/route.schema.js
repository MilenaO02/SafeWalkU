"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRouteSchema = exports.createRouteSchema = void 0;
const zod_1 = require("zod");
exports.createRouteSchema = zod_1.z.object({
    nombre_ruta: zod_1.z.string().min(3),
    descripcion: zod_1.z.string().optional(),
    nivel_seguridad: zod_1.z.enum([
        "BAJO",
        "MEDIO",
        "ALTO"
    ]),
    tiempo_estimado: zod_1.z.number().positive()
});
exports.updateRouteSchema = zod_1.z.object({
    nombre_ruta: zod_1.z.string().min(3),
    descripcion: zod_1.z.string().optional(),
    nivel_seguridad: zod_1.z.enum([
        "BAJO",
        "MEDIO",
        "ALTO"
    ]),
    tiempo_estimado: zod_1.z.number().positive()
});

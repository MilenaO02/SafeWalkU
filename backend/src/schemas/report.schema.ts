import { z } from "zod";

export const createReportSchema = z.object({

    descripcion: z
        .string()
        .min(5, "La descripción debe tener al menos 5 caracteres")
        .max(500),

    nivel_riesgo: z.enum([
        "BAJO",
        "MEDIO",
        "ALTO"
    ]),

    id_usuario: z
        .number()
        .int()
        .positive(),

    id_ubicacion: z
        .number()
        .int()
        .positive()

});

export const updateReportSchema = z.object({

    descripcion: z
        .string()
        .min(5)
        .max(500),

    nivel_riesgo: z.enum([
        "BAJO",
        "MEDIO",
        "ALTO"
    ]),

    estado: z.enum([
        "PENDIENTE",
        "VALIDADO",
        "RECHAZADO",
        "DUPLICADO"
    ])

});
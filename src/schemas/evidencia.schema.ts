import { z } from "zod";

export const createEvidenceSchema = z.object({

    url_archivo: z
        .string()
        .url("La URL del archivo no es válida"),

    tipo_archivo: z.enum([
        "IMAGEN",
        "VIDEO"
    ]),

    id_reporte: z
        .number()
        .int()
        .positive()

});

export const updateEvidenceSchema = z.object({

    url_archivo: z
        .string()
        .url(),

    tipo_archivo: z.enum([
        "IMAGEN",
        "VIDEO"
    ])

});
import { z } from "zod";

export const createRouteSchema = z.object({

    nombre_ruta: z.string().min(3),

    descripcion: z.string().optional(),

    nivel_seguridad: z.enum([
        "BAJO",
        "MEDIO",
        "ALTO"
    ]),

    tiempo_estimado: z.number().positive()

});

export const updateRouteSchema = z.object({

    nombre_ruta: z.string().min(3),

    descripcion: z.string().optional(),

    nivel_seguridad: z.enum([
        "BAJO",
        "MEDIO",
        "ALTO"
    ]),

    tiempo_estimado: z.number().positive()

});
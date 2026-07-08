import { z } from "zod";

export const updateUserSchema = z.object({

    nombre: z.string().optional(),

    apellido: z.string().optional(),

    correo: z.string().email().optional(),

    rol: z.enum([
        "ESTUDIANTE",
        "ADMINISTRADOR"
    ]).optional()

});
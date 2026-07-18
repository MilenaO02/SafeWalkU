import { z } from "zod";

export const registerSchema = z.object({

    nombre: z.string().min(2),

    apellido: z.string().min(2),

    correo: z.string().email(),

    contrasena: z.string().min(6),

    rol: z.enum([
        "ESTUDIANTE",
        "ADMINISTRADOR"
    ])

});

export const loginSchema = z.object({

    correo: z.string().email(),

    contrasena: z.string().min(6)

});
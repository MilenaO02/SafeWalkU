import { z } from "zod";

const institutionalEmail = z
    .string()
    .trim()
    .toLowerCase()
    .email("Correo inválido")
    .refine((correo) => correo.endsWith("@uide.edu.ec"), {
        message: "Solo se permiten correos institucionales @uide.edu.ec"
    });

const securePassword = z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(72, "La contraseña no puede superar 72 caracteres")
    .regex(/[a-z]/, "La contraseña debe incluir una letra minúscula")
    .regex(/[A-Z]/, "La contraseña debe incluir una letra mayúscula")
    .regex(/[0-9]/, "La contraseña debe incluir un número");

export const registerSchema = z.object({
    nombre: z.string().trim().min(2).max(100),
    apellido: z.string().trim().min(2).max(100),
    correo: institutionalEmail,
    contrasena: securePassword
}).strict();

export const loginSchema = z.object({
    correo: institutionalEmail,
    contrasena: z.string().min(1).max(72)
}).strict();

export const switchRoleSchema = z.object({
    rol: z.enum(["ESTUDIANTE", "ADMINISTRADOR"])
}).strict();

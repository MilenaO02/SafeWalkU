import { z } from "zod";

const personName = z.string()
    .trim()
    .min(2, "Mínimo 2 caracteres")
    .max(100, "Máximo 100 caracteres")
    .regex(/^[\p{L}\p{M}]+(?:[ '\u2019-][\p{L}\p{M}]+)*$/u, "El campo solo puede contener letras, tildes y espacios");

const profileFields = {
    nombre: personName.optional(),
    apellido: personName.optional(),
    correo: z.string().trim().toLowerCase().email().refine(
        (correo) => correo.endsWith("@uide.edu.ec"),
        "Solo se permiten correos institucionales @uide.edu.ec"
    ).optional()
};

export const updateUserSchema = z.object(profileFields)
    .strict()
    .refine((data) => Object.keys(data).length > 0, "Debe enviar al menos un campo");

export const updateOwnProfileSchema = z.object(profileFields)
    .strict()
    .refine((data) => Object.keys(data).length > 0, "Debe enviar al menos un campo");

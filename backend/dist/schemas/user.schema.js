import { z } from "zod";
const profileFields = {
    nombre: z.string().trim().min(2).max(100).optional(),
    apellido: z.string().trim().min(2).max(100).optional(),
    correo: z.string().trim().toLowerCase().email().refine((correo) => correo.endsWith("@uide.edu.ec"), "Solo se permiten correos institucionales @uide.edu.ec").optional()
};
export const updateUserSchema = z.object(profileFields)
    .strict()
    .refine((data) => Object.keys(data).length > 0, "Debe enviar al menos un campo");
export const updateOwnProfileSchema = z.object(profileFields)
    .strict()
    .refine((data) => Object.keys(data).length > 0, "Debe enviar al menos un campo");

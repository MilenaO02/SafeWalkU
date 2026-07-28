import { z } from "zod";

const relationship = z.enum(["PADRE", "MADRE", "HERMANO", "HERMANA", "AMIGO", "PAREJA", "OTRO"]);
const contactName = z.string()
    .trim()
    .min(2, "Mínimo 2 caracteres")
    .max(100, "Máximo 100 caracteres")
    .regex(/^[\p{L}\p{M}]+(?:[ '\u2019-][\p{L}\p{M}]+)*$/u, "El campo solo puede contener letras, tildes y espacios");

export const createContactSchema = z.object({
    nombre: contactName,
    telefono: z.string().trim().regex(/^\+?[0-9][0-9\s-]{6,19}$/, "Teléfono inválido"),
    parentesco: relationship
}).strict();

export const updateContactSchema = z.object({
    nombre: contactName.optional(),
    telefono: z.string().trim().regex(/^\+?[0-9][0-9\s-]{6,19}$/, "Teléfono inválido").optional(),
    parentesco: relationship.optional()
}).strict().refine((data) => Object.keys(data).length > 0, "Debe enviar al menos un campo");

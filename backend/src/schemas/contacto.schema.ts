import { z } from "zod";

const relationship = z.enum(["PADRE", "MADRE", "HERMANO", "HERMANA", "AMIGO", "PAREJA", "OTRO"]);

export const createContactSchema = z.object({
    nombre: z.string().trim().min(2).max(100),
    telefono: z.string().trim().regex(/^\+?[0-9][0-9\s-]{6,19}$/, "Teléfono inválido"),
    parentesco: relationship
}).strict();

export const updateContactSchema = z.object({
    nombre: z.string().trim().min(2).max(100).optional(),
    telefono: z.string().trim().regex(/^\+?[0-9][0-9\s-]{6,19}$/, "Teléfono inválido").optional(),
    parentesco: relationship.optional()
}).strict().refine((data) => Object.keys(data).length > 0, "Debe enviar al menos un campo");

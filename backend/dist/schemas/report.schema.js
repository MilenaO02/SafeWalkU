import { z } from "zod";
const riskLevel = z.enum(["BAJO", "MEDIO", "ALTO"]);
const reportStatus = z.enum(["PENDIENTE", "VALIDADO", "RECHAZADO", "DUPLICADO"]);
export const createReportSchema = z.object({
    descripcion: z.string().trim().min(5).max(500),
    nivel_riesgo: riskLevel,
    id_ubicacion: z.number().int().positive()
}).strict();
export const updateReportSchema = z.object({
    descripcion: z.string().trim().min(5).max(500).optional(),
    nivel_riesgo: riskLevel.optional(),
    estado: reportStatus.optional()
}).strict().refine((data) => Object.keys(data).length > 0, "Debe enviar al menos un campo");
export const createSosSchema = z.object({
    descripcion: z.string().trim().min(5).max(500).default("Alerta SOS activada por el usuario"),
    id_ubicacion: z.number().int().positive()
}).strict();

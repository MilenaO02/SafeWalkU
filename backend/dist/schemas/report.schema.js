import { z } from "zod";
/**
 * Shared risk / status enums
 */
const riskLevel = z.enum(["BAJO", "MEDIO", "ALTO"]);
const reportStatus = z.enum(["PENDIENTE", "VALIDADO", "RECHAZADO", "DUPLICADO"]);
/**
 * Sanitisation helpers
 * ─────────────────────────────────────────────────────────────────────────
 * .trim()         — strips leading/trailing whitespace
 * .max()          — hard cap prevents oversized payloads
 * stripControlChars — removes invisible / control characters that could
 *                    cause confusion when displayed or stored
 *
 * Note: Parameterised queries (mysql2) already protect against SQL injection.
 * These transformations add a second layer of defence (defence in depth).
 */
const stripControlChars = (value) => 
// Remove ASCII control characters (0x00–0x1F, 0x7F) except tab and newline
value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
const safeText = (min, max) => z.string()
    .trim()
    .min(min, `Mínimo ${min} caracteres`)
    .max(max, `Máximo ${max} caracteres`)
    .transform(stripControlChars);
/**
 * createReportSchema
 * Used by students to file an incident report (POST /reports).
 */
export const createReportSchema = z
    .object({
    descripcion: safeText(5, 500),
    nivel_riesgo: riskLevel,
    latitud: z.number().min(-90).max(90),
    longitud: z.number().min(-180).max(180),
    precision_gps: z.number().positive().max(10000),
    fecha_captura_gps: z.string().datetime(),
    direccion_aproximada: safeText(3, 255).optional(),
})
    .strict()
    .refine((data) => new Date(data.fecha_captura_gps).getTime() <= Date.now() + 5 * 60 * 1000, { message: "La fecha de captura GPS no puede estar en el futuro", path: ["fecha_captura_gps"] });
/**
 * updateReportSchema
 * Used by admins to update status or description of an existing report.
 */
export const updateReportSchema = z
    .object({
    descripcion: safeText(5, 500).optional(),
    nivel_riesgo: riskLevel.optional(),
    estado: reportStatus.optional(),
})
    .strict()
    .refine((data) => Object.keys(data).length > 0, "Debe enviar al menos un campo");
/**
 * createSosSchema
 * Used when a student activates the SOS panic button (POST /reports/sos).
 */
export const createSosSchema = z
    .object({
    descripcion: safeText(5, 500).default("Alerta SOS activada por el usuario"),
    latitud: z.number().min(-90).max(90),
    longitud: z.number().min(-180).max(180),
    precision_gps: z.number().positive().max(10000),
    fecha_captura_gps: z.string().datetime(),
    direccion_aproximada: safeText(3, 255).optional(),
})
    .strict()
    .refine((data) => new Date(data.fecha_captura_gps).getTime() <= Date.now() + 5 * 60 * 1000, { message: "La fecha de captura GPS no puede estar en el futuro", path: ["fecha_captura_gps"] });

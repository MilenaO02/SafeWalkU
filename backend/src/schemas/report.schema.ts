import { z } from "zod";

/**
 * Shared risk / status enums
 */
const riskLevel   = z.enum(["BAJO", "MEDIO", "ALTO"]);
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
const stripControlChars = (value: string) =>
    // Remove ASCII control characters (0x00–0x1F, 0x7F) except tab and newline
    value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

const safeText = (min: number, max: number) =>
    z.string()
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
        descripcion:  safeText(5, 500),
        nivel_riesgo: riskLevel,
        id_ubicacion: z.number().int().positive(),
    })
    .strict();

/**
 * updateReportSchema
 * Used by admins to update status or description of an existing report.
 */
export const updateReportSchema = z
    .object({
        descripcion:  safeText(5, 500).optional(),
        nivel_riesgo: riskLevel.optional(),
        estado:       reportStatus.optional(),
    })
    .strict()
    .refine(
        (data) => Object.keys(data).length > 0,
        "Debe enviar al menos un campo"
    );

/**
 * createSosSchema
 * Used when a student activates the SOS panic button (POST /reports/sos).
 */
export const createSosSchema = z
    .object({
        descripcion:  safeText(5, 500).default("Alerta SOS activada por el usuario"),
        id_ubicacion: z.number().int().positive(),
    })
    .strict();

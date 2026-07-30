import { z } from 'zod';
import { ValidationError, ConfirmationRequiredError } from '../utils/errors.js';

export const LatitudeSchema = z
  .number({ invalid_type_error: 'La latitud debe ser un número entre -90 y 90.' })
  .min(-90, 'La latitud mínima permitida es -90.')
  .max(90, 'La latitud máxima permitida es 90.');

export const LongitudeSchema = z
  .number({ invalid_type_error: 'La longitud debe ser un número entre -180 y 180.' })
  .min(-180, 'La longitud mínima permitida es -180.')
  .max(180, 'La longitud máxima permitida es 180.');

export const PhoneSchema = z
  .string({ invalid_type_error: 'El teléfono debe ser una cadena de texto.' })
  .regex(/^\+?[0-9][0-9\s-]{6,19}$/, 'Formato de teléfono inválido (ej: +593991234567 o 0991234567).');

export const PaginationLimitSchema = z
  .number()
  .int('El límite debe ser un número entero.')
  .min(1, 'El límite mínimo es 1.')
  .max(100, 'El límite máximo es 100.')
  .default(20);

export const PositiveIdSchema = z
  .number({ invalid_type_error: 'El ID debe ser un número entero positivo.' })
  .int('El ID debe ser un número entero.')
  .positive('El ID debe ser mayor a 0.');

export const RiskLevelSchema = z.enum(['BAJO', 'MEDIO', 'ALTO']);
export const ReportStateSchema = z.enum(['PENDIENTE', 'VALIDADO', 'RECHAZADO', 'DUPLICADO', 'CANCELADO']);
export const ReportTypeSchema = z.enum(['INCIDENTE', 'SOS_PANICO']);

export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const formattedErrors = result.error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join('; ');
    throw new ValidationError(`Parámetros de entrada inválidos: ${formattedErrors}`);
  }
  return result.data;
}

export function requireExplicitConfirmation(confirmation: boolean | undefined, actionDescription: string): void {
  if (confirmation !== true) {
    throw new ConfirmationRequiredError(actionDescription);
  }
}

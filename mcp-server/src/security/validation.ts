import { z } from 'zod';
import { ConfirmationRequiredError, ValidationError } from '../utils/errors.js';

export const LatitudeSchema = z.number({ invalid_type_error: 'La latitud debe ser un numero entre -90 y 90.' }).min(-90).max(90);
export const LongitudeSchema = z.number({ invalid_type_error: 'La longitud debe ser un numero entre -180 y 180.' }).min(-180).max(180);
// Debe coincidir con backend/src/schemas/contacto.schema.ts.
export const PhoneSchema = z.string({ invalid_type_error: 'El telefono debe ser texto.' }).regex(/^[0-9]{10}$/, 'El telefono debe contener exactamente 10 digitos.');
export const PaginationLimitSchema = z.number().int('El limite debe ser un numero entero.').min(1).max(100).default(20);
export const PositiveIdSchema = z.number({ invalid_type_error: 'El ID debe ser un numero entero positivo.' }).int().positive();
export const RiskLevelSchema = z.enum(['BAJO', 'MEDIO', 'ALTO']);
export const ReportStateSchema = z.enum(['PENDIENTE', 'VALIDADO', 'RECHAZADO', 'DUPLICADO']);
export const ReportTypeSchema = z.enum(['INCIDENTE', 'SOS_PANICO']);

export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data ?? {});
  if (!result.success) {
    const formattedErrors = result.error.errors.map((error) => `${error.path.join('.') || 'entrada'}: ${error.message}`).join('; ');
    throw new ValidationError(`Parametros de entrada invalidos: ${formattedErrors}`);
  }
  return result.data;
}

export function requireExplicitConfirmation(confirmation: boolean | undefined, actionDescription: string): void {
  if (confirmation !== true) throw new ConfirmationRequiredError(actionDescription);
}

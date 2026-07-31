import { z } from 'zod';
import { SafeWalkApiClient } from '../api/safewalk-client.js';
import { PhoneSchema, requireExplicitConfirmation, validateInput } from '../security/validation.js';

const ParentescoSchema = z.enum(['PADRE', 'MADRE', 'HERMANO', 'HERMANA', 'AMIGO', 'PAREJA', 'OTRO']);
export const CrearContactoEmergenciaSchema = z.object({
  nombre: z.string().trim().min(2).max(100).regex(/^[\p{L}\p{M}]+(?:[ '\u2019-][\p{L}\p{M}]+)*$/u),
  telefono: PhoneSchema,
  parentesco: ParentescoSchema,
  confirmacion_explicita: z.boolean()
}).strict();

export async function crearContactoEmergencia(client: SafeWalkApiClient, args: unknown) {
  const params = validateInput(CrearContactoEmergenciaSchema, args);
  requireExplicitConfirmation(params.confirmacion_explicita, `Agregar contacto de emergencia ${params.nombre} (${params.parentesco}).`);
  return client.request<unknown>('/contacts', { method: 'POST', body: { nombre: params.nombre, telefono: params.telefono, parentesco: params.parentesco } });
}

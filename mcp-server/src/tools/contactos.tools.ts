import { z } from 'zod';
import { SafeWalkApiClient } from '../api/safewalk-client.js';
import { validateInput, requireExplicitConfirmation, PhoneSchema } from '../security/validation.js';

export const ParentescoSchema = z.enum(['PADRE', 'MADRE', 'HERMANO', 'HERMANA', 'AMIGO', 'PAREJA', 'OTRO']);

export const CrearContactoEmergenciaSchema = z.object({
  nombre: z.string().min(2, 'Nombre mínimo de 2 caracteres.').max(100, 'Nombre máximo de 100 caracteres.'),
  telefono: PhoneSchema,
  parentesco: ParentescoSchema,
  confirmacion_explicita: z.boolean().describe('Confirmación explícita requerida para registrar un nuevo contacto de emergencia.')
});

export async function crearContactoEmergencia(client: SafeWalkApiClient, args: unknown) {
  const params = validateInput(CrearContactoEmergenciaSchema, args);

  requireExplicitConfirmation(
    params.confirmacion_explicita,
    `Agregar contacto de emergencia: ${params.nombre} (${params.parentesco}, ${params.telefono})`
  );

  const data = await client.request<unknown>('/contacts', {
    method: 'POST',
    body: {
      nombre: params.nombre,
      telefono: params.telefono,
      parentesco: params.parentesco
    }
  });

  return data;
}

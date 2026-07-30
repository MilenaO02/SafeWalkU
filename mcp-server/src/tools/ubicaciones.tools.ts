import { z } from 'zod';
import { SafeWalkApiClient } from '../api/safewalk-client.js';
import { validateInput, PaginationLimitSchema, PositiveIdSchema } from '../security/validation.js';

export const ListarUbicacionesSchema = z.object({
  q: z.string().min(2).max(100).optional().describe('Término de búsqueda opcional por nombre o dirección.'),
  limit: PaginationLimitSchema.optional().describe('Número máximo de ubicaciones a retornar (1-100).')
});

export const ConsultarUbicacionSchema = z.object({
  id_ubicacion: PositiveIdSchema.describe('ID numérico entero positivo de la ubicación a consultar.')
});

export async function listarUbicaciones(client: SafeWalkApiClient, args: unknown) {
  const params = validateInput(ListarUbicacionesSchema, args);
  
  if (params.q) {
    const data = await client.request<unknown>('/ubicaciones/buscar', {
      params: { q: params.q }
    });
    return data;
  }

  const data = await client.request<unknown[]>('/ubicaciones');
  if (Array.isArray(data) && params.limit) {
    return data.slice(0, params.limit);
  }
  return data;
}

export async function consultarUbicacion(client: SafeWalkApiClient, args: unknown) {
  const params = validateInput(ConsultarUbicacionSchema, args);
  const data = await client.request<unknown[]>('/ubicaciones');
  
  if (Array.isArray(data)) {
    const item = data.find((u: unknown) => typeof u === 'object' && u !== null && 'id_ubicacion' in u && (u as { id_ubicacion: number }).id_ubicacion === params.id_ubicacion);
    if (item) return item;
  }

  throw new Error(`No se encontró la ubicación con ID ${params.id_ubicacion}.`);
}

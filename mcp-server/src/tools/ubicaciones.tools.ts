import { z } from 'zod';
import { SafeWalkApiClient } from '../api/safewalk-client.js';
import { PaginationLimitSchema, PositiveIdSchema, validateInput } from '../security/validation.js';

export const ListarUbicacionesSchema = z.object({
  q: z.string().trim().min(2).max(100).optional(),
  limit: PaginationLimitSchema.optional()
}).strict();
export const ConsultarUbicacionSchema = z.object({ id_ubicacion: PositiveIdSchema }).strict();

export async function listarUbicaciones(client: SafeWalkApiClient, args: unknown) {
  const params = validateInput(ListarUbicacionesSchema, args);
  const data = params.q
    ? await client.request<unknown[]>('/ubicaciones/buscar', { params: { q: params.q } })
    : await client.request<unknown[]>('/ubicaciones');
  return Array.isArray(data) ? data.slice(0, params.limit ?? 20) : data;
}

export async function consultarUbicacion(client: SafeWalkApiClient, args: unknown) {
  const { id_ubicacion } = validateInput(ConsultarUbicacionSchema, args);
  // La API actual no expone GET /ubicaciones/:id; se usa su listado real.
  const data = await client.request<unknown[]>('/ubicaciones');
  const item = Array.isArray(data) ? data.find((value) => {
    return typeof value === 'object' && value !== null && Number((value as Record<string, unknown>).id_ubicacion) === id_ubicacion;
  }) : undefined;
  if (!item) throw new Error(`No se encontro la ubicacion con ID ${id_ubicacion}.`);
  return item;
}

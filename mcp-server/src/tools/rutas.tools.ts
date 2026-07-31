import { z } from 'zod';
import { SafeWalkApiClient } from '../api/safewalk-client.js';
import { PaginationLimitSchema, PositiveIdSchema, RiskLevelSchema, validateInput } from '../security/validation.js';

export const ListarRutasSchema = z.object({ nivel_seguridad: RiskLevelSchema.optional(), limit: PaginationLimitSchema.optional() }).strict();
export const ConsultarRutaSchema = z.object({ id_ruta: PositiveIdSchema }).strict();

export async function listarRutas(client: SafeWalkApiClient, args: unknown) {
  const { nivel_seguridad, limit = 20 } = validateInput(ListarRutasSchema, args);
  const data = await client.request<unknown[]>('/routes');
  const filtered = Array.isArray(data) && nivel_seguridad
    ? data.filter((route) => typeof route === 'object' && route !== null && (route as Record<string, unknown>).nivel_seguridad === nivel_seguridad)
    : data;
  return Array.isArray(filtered) ? filtered.slice(0, limit) : filtered;
}

export async function consultarRuta(client: SafeWalkApiClient, args: unknown) {
  const { id_ruta } = validateInput(ConsultarRutaSchema, args);
  return client.request<unknown>(`/routes/${id_ruta}`);
}

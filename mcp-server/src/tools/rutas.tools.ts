import { z } from 'zod';
import { SafeWalkApiClient } from '../api/safewalk-client.js';
import { validateInput, PaginationLimitSchema, PositiveIdSchema, RiskLevelSchema } from '../security/validation.js';

export const ListarRutasSchema = z.object({
  nivel_seguridad: RiskLevelSchema.optional().describe('Filtro opcional por nivel de seguridad de la ruta (BAJO, MEDIO, ALTO).'),
  limit: PaginationLimitSchema.optional().describe('Número máximo de rutas a retornar (1-100).')
});

export const ConsultarRutaSchema = z.object({
  id_ruta: PositiveIdSchema.describe('ID numérico entero de la ruta a consultar.')
});

export async function listarRutas(client: SafeWalkApiClient, args: unknown) {
  const params = validateInput(ListarRutasSchema, args);
  let data = await client.request<unknown[]>('/routes');
  
  if (Array.isArray(data)) {
    if (params.nivel_seguridad) {
      data = data.filter((r: unknown) => typeof r === 'object' && r !== null && 'nivel_seguridad' in r && (r as { nivel_seguridad: string }).nivel_seguridad === params.nivel_seguridad);
    }
    if (params.limit) {
      data = data.slice(0, params.limit);
    }
  }

  return data;
}

export async function consultarRuta(client: SafeWalkApiClient, args: unknown) {
  const params = validateInput(ConsultarRutaSchema, args);
  const data = await client.request<unknown>(`/routes/${params.id_ruta}`);
  return data;
}

import { z } from 'zod';
import { SafeWalkApiClient } from '../api/safewalk-client.js';
import {
  validateInput,
  requireExplicitConfirmation,
  PaginationLimitSchema,
  PositiveIdSchema,
  RiskLevelSchema,
  ReportStateSchema,
  ReportTypeSchema,
  LatitudeSchema,
  LongitudeSchema
} from '../security/validation.js';
import { enforceToolAuthorization } from '../security/authorization.js';
import { getConfig } from '../config.js';

export const ListarReportesSchema = z.object({
  estado: ReportStateSchema.optional().describe('Filtro por estado (PENDIENTE, VALIDADO, RECHAZADO, DUPLICADO, CANCELADO).'),
  nivel_riesgo: RiskLevelSchema.optional().describe('Filtro por nivel de riesgo (BAJO, MEDIO, ALTO).'),
  tipo_reporte: ReportTypeSchema.optional().describe('Filtro por tipo de reporte (INCIDENTE, SOS_PANICO).'),
  limit: PaginationLimitSchema.optional().describe('Número máximo de reportes a retornar (1-100).')
});

export const ConsultarReporteSchema = z.object({
  id_reporte: PositiveIdSchema.describe('ID del reporte a consultar.')
});

export const CrearReporteSchema = z.object({
  descripcion: z.string().min(5, 'Descripción mínima de 5 caracteres.').max(500, 'Descripción máxima de 500 caracteres.'),
  nivel_riesgo: RiskLevelSchema,
  latitud: LatitudeSchema,
  longitud: LongitudeSchema,
  precision_gps: z.number().positive().max(10000).default(10),
  fecha_captura_gps: z.string().datetime().optional().default(() => new Date().toISOString()),
  direccion_aproximada: z.string().min(3).max(255).optional(),
  confirmacion_explicita: z.boolean().describe('Confirmación explícita requerida para enviar un reporte a la API.')
});

export const ActualizarEstadoReporteSchema = z.object({
  id_reporte: PositiveIdSchema,
  estado: ReportStateSchema,
  descripcion: z.string().min(5).max(500).optional(),
  nivel_riesgo: RiskLevelSchema.optional(),
  confirmacion_explicita: z.boolean().describe('Confirmación explícita requerida para actualizar el estado de un reporte.')
});

export async function listarReportes(client: SafeWalkApiClient, args: unknown) {
  const params = validateInput(ListarReportesSchema, args);
  let data = await client.request<unknown[]>('/reports');

  if (Array.isArray(data)) {
    if (params.estado) {
      data = data.filter((r: unknown) => typeof r === 'object' && r !== null && 'estado' in r && (r as { estado: string }).estado === params.estado);
    }
    if (params.nivel_riesgo) {
      data = data.filter((r: unknown) => typeof r === 'object' && r !== null && 'nivel_riesgo' in r && (r as { nivel_riesgo: string }).nivel_riesgo === params.nivel_riesgo);
    }
    if (params.tipo_reporte) {
      data = data.filter((r: unknown) => typeof r === 'object' && r !== null && 'tipo_reporte' in r && (r as { tipo_reporte: string }).tipo_reporte === params.tipo_reporte);
    }
    if (params.limit) {
      data = data.slice(0, params.limit);
    }
  }

  return data;
}

export async function consultarReporte(client: SafeWalkApiClient, args: unknown) {
  const params = validateInput(ConsultarReporteSchema, args);
  const data = await client.request<unknown>(`/reports/${params.id_reporte}`);
  return data;
}

export async function crearReporte(client: SafeWalkApiClient, args: unknown) {
  const params = validateInput(CrearReporteSchema, args);
  
  requireExplicitConfirmation(
    params.confirmacion_explicita,
    `Crear nuevo reporte de tipo INCIDENTE (${params.nivel_riesgo}): "${params.descripcion}" en [${params.latitud}, ${params.longitud}]`
  );

  const payload = {
    descripcion: params.descripcion,
    nivel_riesgo: params.nivel_riesgo,
    latitud: params.latitud,
    longitud: params.longitud,
    precision_gps: params.precision_gps,
    fecha_captura_gps: params.fecha_captura_gps || new Date().toISOString(),
    ...(params.direccion_aproximada ? { direccion_aproximada: params.direccion_aproximada } : {})
  };

  const data = await client.request<unknown>('/reports', {
    method: 'POST',
    body: payload
  });

  return data;
}

export async function actualizarEstadoReporte(client: SafeWalkApiClient, args: unknown) {
  const config = getConfig();
  enforceToolAuthorization('safewalk_actualizar_estado_reporte', config.apiToken);

  const params = validateInput(ActualizarEstadoReporteSchema, args);

  requireExplicitConfirmation(
    params.confirmacion_explicita,
    `Cambiar el estado del reporte #${params.id_reporte} a "${params.estado}"`
  );

  const payload: Record<string, unknown> = { estado: params.estado };
  if (params.descripcion) payload.descripcion = params.descripcion;
  if (params.nivel_riesgo) payload.nivel_riesgo = params.nivel_riesgo;

  const data = await client.request<unknown>(`/reports/${params.id_reporte}`, {
    method: 'PUT',
    body: payload
  });

  return data;
}

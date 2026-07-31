import { z } from 'zod';
import { SafeWalkApiClient } from '../api/safewalk-client.js';
import { enforceToolAuthorization } from '../security/authorization.js';
import { LatitudeSchema, LongitudeSchema, PaginationLimitSchema, PositiveIdSchema, ReportStateSchema, ReportTypeSchema, RiskLevelSchema, requireExplicitConfirmation, validateInput } from '../security/validation.js';
import { getConfig } from '../config.js';

export const ListarReportesSchema = z.object({
  estado: ReportStateSchema.optional(), nivel_riesgo: RiskLevelSchema.optional(), tipo_reporte: ReportTypeSchema.optional(), limit: PaginationLimitSchema.optional()
}).strict();
export const ConsultarReporteSchema = z.object({ id_reporte: PositiveIdSchema }).strict();
export const CrearReporteSchema = z.object({
  descripcion: z.string().trim().min(5).max(500),
  nivel_riesgo: RiskLevelSchema,
  latitud: LatitudeSchema,
  longitud: LongitudeSchema,
  precision_gps: z.number().positive().max(10000).default(10),
  fecha_captura_gps: z.string().datetime().optional().default(() => new Date().toISOString()),
  direccion_aproximada: z.string().trim().min(3).max(255).optional(),
  confirmacion_explicita: z.boolean()
}).strict();
export const ActualizarEstadoReporteSchema = z.object({
  id_reporte: PositiveIdSchema,
  estado: ReportStateSchema,
  descripcion: z.string().trim().min(5).max(500).optional(),
  nivel_riesgo: RiskLevelSchema.optional(),
  confirmacion_explicita: z.boolean()
}).strict();

export async function listarReportes(client: SafeWalkApiClient, args: unknown) {
  const { estado, nivel_riesgo, tipo_reporte, limit = 20 } = validateInput(ListarReportesSchema, args);
  const data = await client.request<unknown[]>('/reports');
  const filtered = Array.isArray(data) ? data.filter((item) => {
    if (!item || typeof item !== 'object') return false;
    const report = item as Record<string, unknown>;
    return (!estado || report.estado === estado) && (!nivel_riesgo || report.nivel_riesgo === nivel_riesgo) && (!tipo_reporte || report.tipo_reporte === tipo_reporte);
  }).slice(0, limit) : data;
  return minimizeReports(filtered);
}

export async function consultarReporte(client: SafeWalkApiClient, args: unknown) {
  const { id_reporte } = validateInput(ConsultarReporteSchema, args);
  return minimizeReports(await client.request<unknown>(`/reports/${id_reporte}`));
}

export async function crearReporte(client: SafeWalkApiClient, args: unknown) {
  const params = validateInput(CrearReporteSchema, args);
  requireExplicitConfirmation(params.confirmacion_explicita, `Crear reporte INCIDENTE de nivel ${params.nivel_riesgo} en la coordenada indicada.`);
  return client.request<unknown>('/reports', { method: 'POST', body: {
    descripcion: params.descripcion, nivel_riesgo: params.nivel_riesgo, latitud: params.latitud, longitud: params.longitud,
    precision_gps: params.precision_gps, fecha_captura_gps: params.fecha_captura_gps,
    ...(params.direccion_aproximada ? { direccion_aproximada: params.direccion_aproximada } : {})
  } });
}

export async function actualizarEstadoReporte(client: SafeWalkApiClient, args: unknown) {
  enforceToolAuthorization('safewalk_actualizar_estado_reporte', getConfig().apiToken);
  const params = validateInput(ActualizarEstadoReporteSchema, args);
  requireExplicitConfirmation(params.confirmacion_explicita, `Cambiar el estado del reporte #${params.id_reporte} a ${params.estado}.`);
  return client.request<unknown>(`/reports/${params.id_reporte}`, { method: 'PUT', body: {
    estado: params.estado,
    ...(params.descripcion ? { descripcion: params.descripcion } : {}),
    ...(params.nivel_riesgo ? { nivel_riesgo: params.nivel_riesgo } : {})
  } });
}

function minimizeReports(data: unknown): unknown {
  const minimize = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(minimize);
    if (!value || typeof value !== 'object') return value;
    const { nombre: _nombre, apellido: _apellido, correo: _correo, telefono: _telefono, id_usuario: _idUsuario, ...safe } = value as Record<string, unknown>;
    return Object.fromEntries(Object.entries(safe).map(([key, nested]) => [key, minimize(nested)]));
  };
  return minimize(data);
}

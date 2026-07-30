import { z } from 'zod';

const point = z.object({
    lat: z.coerce.number().min(-90).max(90),
    lng: z.coerce.number().min(-180).max(180)
}).strict();

const polygon = z.array(point).min(3, 'El poligono necesita al menos tres vertices').max(200, 'El poligono no puede tener mas de 200 vertices');
const common = {
    nombre: z.string().trim().min(3).max(150),
    descripcion: z.string().trim().min(3).max(500),
    observaciones: z.string().trim().max(500).optional().default(''),
    nivel_riesgo: z.enum(['BAJO', 'MEDIO', 'ALTO', 'CRITICO']),
    tipo_riesgo: z.enum(['ROBO', 'ASALTO', 'ACOSO', 'POCA_ILUMINACION', 'ACCIDENTES', 'ZONA_CONFLICTIVA', 'OTRO']),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'El color debe ser hexadecimal, por ejemplo #f97316').default('#f97316'),
    opacidad: z.coerce.number().min(0.05).max(0.9).default(0.35),
    radio_proximidad_metros: z.coerce.number().int().min(10).max(1000).default(80),
    polygon_json: polygon
};

export const createRiskZoneSchema = z.object(common).strict();
export const updateRiskZoneSchema = z.object({
    ...Object.fromEntries(Object.entries(common).map(([key, value]) => [key, value.optional()])),
    estado: z.enum(['ACTIVA', 'INACTIVA']).optional()
}).strict().refine(value => Object.keys(value).length > 0, 'Debe enviar al menos un campo');
export const riskZoneStatusSchema = z.object({ estado: z.enum(['ACTIVA', 'INACTIVA']) }).strict();
export const approveDynamicRiskZoneSchema = z.object({ candidate_key: z.string().trim().min(1), ...common }).strict();

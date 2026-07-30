import pool from '../config/database.js';
import riskZoneRepository, { RiskPoint, RiskZoneInput } from '../repositories/risk-zone.repository.js';
import { riskScoringConfig } from '../config/risk-scoring.config.js';
import { RowDataPacket } from 'mysql2';

type DynamicCandidate = {
    candidate_key: string; nombre: string; descripcion: string; nivel_riesgo: 'BAJO'|'MEDIO'|'ALTO'|'CRITICO';
    tipo_riesgo: RiskZoneInput['tipo_riesgo']; polygon_json: RiskPoint[]; radio_proximidad_metros: number;
    evidence: { reportes: number; sos: number; ids: number[] }; expires_at: string;
};
let dynamicCache: { expires: number; data: DynamicCandidate[] } | null = null;

function distance(a: RiskPoint, b: RiskPoint) {
    const radians = Math.PI / 180;
    const deltaLat = (b.lat - a.lat) * radians;
    const deltaLng = (b.lng - a.lng) * radians;
    const value = Math.sin(deltaLat / 2) ** 2 + Math.cos(a.lat * radians) * Math.cos(b.lat * radians) * Math.sin(deltaLng / 2) ** 2;
    return 6371000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}
function candidatePolygon(points: RiskPoint[], paddingMeters: number): RiskPoint[] {
    const latitudeOffset = paddingMeters / 111320;
    const longitudeOffset = paddingMeters / (111320 * Math.cos(points[0].lat * Math.PI / 180));
    const latitudes = points.map(point => point.lat), longitudes = points.map(point => point.lng);
    const minLat = Math.min(...latitudes) - latitudeOffset, maxLat = Math.max(...latitudes) + latitudeOffset;
    const minLng = Math.min(...longitudes) - longitudeOffset, maxLng = Math.max(...longitudes) + longitudeOffset;
    return [{ lat: minLat, lng: minLng }, { lat: minLat, lng: maxLng }, { lat: maxLat, lng: maxLng }, { lat: maxLat, lng: minLng }];
}

class RiskZoneService {
    async list(activeOnly = false) { return riskZoneRepository.findAll(activeOnly); }
    async get(id: number) { return riskZoneRepository.findById(id); }
    async create(data: RiskZoneInput, userId: number) {
        const adminId = await riskZoneRepository.findAdminId(userId);
        if (!adminId) throw new Error('El usuario no posee un perfil de administrador.');
        const id = await riskZoneRepository.create(data, adminId);
        return riskZoneRepository.findById(id);
    }
    async update(id: number, data: Partial<RiskZoneInput> & { estado?: string }) {
        if (!Number.isInteger(id) || id < 1 || !(await riskZoneRepository.update(id, data))) throw new Error('Zona de riesgo no encontrada.');
        return riskZoneRepository.findById(id);
    }
    async remove(id: number) {
        if (!Number.isInteger(id) || id < 1 || !(await riskZoneRepository.remove(id))) throw new Error('Zona de riesgo no encontrada.');
    }
    async dynamic(): Promise<DynamicCandidate[]> {
        if (dynamicCache && dynamicCache.expires > Date.now()) return dynamicCache.data;
        const since = new Date(Date.now() - riskScoringConfig.dynamicValidityHours * 60 * 60 * 1000);
        const [rows] = await pool.query<RowDataPacket[]>(`SELECT r.id_reporte,r.tipo_reporte,r.nivel_riesgo,c.latitud,c.longitud FROM reporte r INNER JOIN ubicacion u ON u.id_ubicacion=r.id_ubicacion INNER JOIN coordenada c ON c.id_ubicacion=u.id_ubicacion WHERE r.estado_registro='ACTIVO' AND r.estado IN ('PENDIENTE','VALIDADO') AND r.fecha_reporte >= ?`, [since]);
        const groups: RowDataPacket[][] = [];
        for (const row of rows) {
            const point = { lat: Number(row.latitud), lng: Number(row.longitud) };
            if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) continue;
            const group = groups.find(candidate => candidate.some(item => distance(point, { lat: Number(item.latitud), lng: Number(item.longitud) }) <= riskScoringConfig.dynamicClusterMeters));
            if (group) group.push(row); else groups.push([row]);
        }
        const data = groups.filter(group => group.length >= 2 || group.some(row => row.tipo_reporte === 'SOS_PANICO')).map((group, index) => {
            const sos = group.filter(row => row.tipo_reporte === 'SOS_PANICO').length;
            const high = group.filter(row => row.nivel_riesgo === 'ALTO').length;
            const level: DynamicCandidate['nivel_riesgo'] = sos > 0 || high >= 2 ? 'CRITICO' : high > 0 ? 'ALTO' : group.length >= 3 ? 'MEDIO' : 'BAJO';
            const points = group.map(row => ({ lat: Number(row.latitud), lng: Number(row.longitud) }));
            const ids = group.map(row => Number(row.id_reporte)).sort((a, b) => a - b);
            const tipo_riesgo: DynamicCandidate['tipo_riesgo'] = sos ? 'ZONA_CONFLICTIVA' : 'OTRO';
            return { candidate_key: `${ids.join('-')}:${level}`, nombre: `Zona dinamica ${index + 1}`, descripcion: `Calculada con ${group.length} incidente(s) reciente(s) y ${sos} alerta(s) SOS. Requiere aprobacion administrativa.`, nivel_riesgo: level, tipo_riesgo, polygon_json: candidatePolygon(points, riskScoringConfig.dynamicClusterMeters), radio_proximidad_metros: riskScoringConfig.dynamicClusterMeters, evidence: { reportes: group.length - sos, sos, ids }, expires_at: new Date(Date.now() + riskScoringConfig.dynamicCacheTtlMs).toISOString() };
        });
        dynamicCache = { data, expires: Date.now() + riskScoringConfig.dynamicCacheTtlMs };
        return data;
    }
    async statistics() {
        const [monthly, sectors, hours, sos] = await Promise.all([
            pool.query<RowDataPacket[]>(`SELECT DATE_FORMAT(fecha_reporte, '%Y-%m') AS periodo, COUNT(*) AS incidentes FROM reporte WHERE estado_registro='ACTIVO' GROUP BY DATE_FORMAT(fecha_reporte, '%Y-%m') ORDER BY periodo DESC LIMIT 12`),
            pool.query<RowDataPacket[]>(`SELECT u.nombre AS sector, COUNT(*) AS incidentes FROM reporte r INNER JOIN ubicacion u ON u.id_ubicacion=r.id_ubicacion WHERE r.estado_registro='ACTIVO' GROUP BY u.id_ubicacion,u.nombre ORDER BY incidentes DESC LIMIT 10`),
            pool.query<RowDataPacket[]>(`SELECT HOUR(fecha_reporte) AS hora, COUNT(*) AS incidentes FROM reporte WHERE estado_registro='ACTIVO' GROUP BY HOUR(fecha_reporte) ORDER BY hora`),
            pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM reporte WHERE estado_registro='ACTIVO' AND tipo_reporte='SOS_PANICO'`)
        ]);
        return { incidentes_por_mes: monthly[0], sectores_mas_peligrosos: sectors[0], incidentes_por_hora: hours[0], total_sos: Number(sos[0][0]?.total || 0) };
    }
    async heatmapPoints() {
        const [rows] = await pool.query<RowDataPacket[]>(`SELECT r.id_reporte,r.nivel_riesgo,r.tipo_reporte,c.latitud,c.longitud FROM reporte r INNER JOIN ubicacion u ON u.id_ubicacion=r.id_ubicacion INNER JOIN coordenada c ON c.id_ubicacion=u.id_ubicacion WHERE r.estado_registro='ACTIVO' AND r.estado IN ('PENDIENTE','VALIDADO') AND c.latitud IS NOT NULL AND c.longitud IS NOT NULL`);
        return rows.map(row => ({ id_reporte: Number(row.id_reporte), lat: Number(row.latitud), lng: Number(row.longitud), nivel_riesgo: row.nivel_riesgo, tipo_reporte: row.tipo_reporte, weight: row.tipo_reporte === 'SOS_PANICO' ? 1 : row.nivel_riesgo === 'ALTO' ? 0.8 : row.nivel_riesgo === 'MEDIO' ? 0.55 : 0.3 }));
    }
    async approveDynamic(candidateKey: string, input: RiskZoneInput, userId: number) {
        const candidate = (await this.dynamic()).find(item => item.candidate_key === candidateKey);
        if (!candidate) throw new Error('El candidato dinamico ya no esta vigente. Actualiza la lista.');
        return this.create({ ...input, origen_zona: 'DINAMICA_APROBADA' }, userId);
    }
}
export default new RiskZoneService();

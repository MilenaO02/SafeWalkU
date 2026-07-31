import pool from '../config/database.js';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export type RiskPoint = { lat: number; lng: number };
export type RiskZoneInput = {
    nombre: string; descripcion: string; observaciones?: string; nivel_riesgo: 'BAJO'|'MEDIO'|'ALTO'|'CRITICO';
    tipo_riesgo: 'ROBO'|'ASALTO'|'ACOSO'|'POCA_ILUMINACION'|'ACCIDENTES'|'ZONA_CONFLICTIVA'|'OTRO';
    color: string; opacidad: number; radio_proximidad_metros: number; polygon_json: RiskPoint[];
    origen_zona?: 'ADMINISTRADOR'|'DINAMICA_APROBADA';
};

function bounds(polygon: RiskPoint[]) {
    return { minLat: Math.min(...polygon.map(point => point.lat)), maxLat: Math.max(...polygon.map(point => point.lat)), minLng: Math.min(...polygon.map(point => point.lng)), maxLng: Math.max(...polygon.map(point => point.lng)) };
}
function normalize(row: RowDataPacket) {
    return { ...row, polygon_json: typeof row.polygon_json === 'string' ? JSON.parse(row.polygon_json) : row.polygon_json };
}

class RiskZoneRepository {
    async findAll(activeOnly = false) {
        const [rows] = await pool.query<RowDataPacket[]>(`SELECT z.*, u.nombre AS administrador_nombre FROM zona_riesgo z INNER JOIN administrador a ON a.id_administrador=z.id_administrador INNER JOIN usuario u ON u.id_usuario=a.id_usuario ${activeOnly ? "WHERE z.estado='ACTIVA'" : ''} ORDER BY z.fecha_actualizacion DESC`);
        return rows.map(normalize);
    }
    async findById(id: number) {
        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM zona_riesgo WHERE id_zona=?', [id]);
        return rows[0] ? normalize(rows[0]) : null;
    }
    async findAdminId(userId: number) {
        const [rows] = await pool.query<RowDataPacket[]>('SELECT id_administrador FROM administrador WHERE id_usuario=? LIMIT 1', [userId]);
        return rows[0]?.id_administrador as number | undefined;
    }
    async create(data: RiskZoneInput, adminId: number) {
        const box = bounds(data.polygon_json);
        const [result] = await pool.query<ResultSetHeader>(`INSERT INTO zona_riesgo (nombre,descripcion,observaciones,nivel_riesgo,tipo_riesgo,estado,origen_zona,color,opacidad,radio_proximidad_metros,polygon_json,min_lat,max_lat,min_lng,max_lng,id_administrador) VALUES (?,?,?,?,?,'ACTIVA',?,?,?,?,?,?,?,?,?,?)`, [data.nombre, data.descripcion, data.observaciones || null, data.nivel_riesgo, data.tipo_riesgo, data.origen_zona ?? 'ADMINISTRADOR', data.color, data.opacidad, data.radio_proximidad_metros, JSON.stringify(data.polygon_json), box.minLat, box.maxLat, box.minLng, box.maxLng, adminId]);
        return result.insertId;
    }
    async update(id: number, change: Partial<RiskZoneInput> & { estado?: string }) {
        const current = await this.findById(id);
        if (!current) return false;
        const currentZone = current as RiskZoneInput & { estado: string };
        const next = { ...currentZone, ...change, polygon_json: change.polygon_json ?? currentZone.polygon_json } as RiskZoneInput & { estado: string };
        const box = bounds(next.polygon_json);
        const [result] = await pool.query<ResultSetHeader>(`UPDATE zona_riesgo SET nombre=?,descripcion=?,observaciones=?,nivel_riesgo=?,tipo_riesgo=?,estado=?,color=?,opacidad=?,radio_proximidad_metros=?,polygon_json=?,min_lat=?,max_lat=?,min_lng=?,max_lng=? WHERE id_zona=?`, [next.nombre, next.descripcion, next.observaciones || null, next.nivel_riesgo, next.tipo_riesgo, next.estado ?? currentZone.estado, next.color, next.opacidad, next.radio_proximidad_metros, JSON.stringify(next.polygon_json), box.minLat, box.maxLat, box.minLng, box.maxLng, id]);
        return result.affectedRows === 1;
    }
    async remove(id: number) { const [result] = await pool.query<ResultSetHeader>('DELETE FROM zona_riesgo WHERE id_zona=?', [id]); return result.affectedRows === 1; }
}
export default new RiskZoneRepository();

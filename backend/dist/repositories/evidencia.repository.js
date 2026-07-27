import pool from "../config/database.js";
class EvidenceRepository {
    async findAll() {
        const [rows] = await pool.query(`
            SELECT e.*, r.id_usuario, r.estado AS estado_reporte, r.estado_registro
            FROM evidencia e
            INNER JOIN reporte r ON r.id_reporte = e.id_reporte
            WHERE r.estado_registro = 'ACTIVO'
            ORDER BY e.id_evidencia DESC
        `);
        return rows;
    }
    async findById(id) {
        const [rows] = await pool.query(`
            SELECT e.*, r.id_usuario, r.estado AS estado_reporte, r.estado_registro
            FROM evidencia e
            INNER JOIN reporte r ON r.id_reporte = e.id_reporte
            WHERE e.id_evidencia = ? AND r.estado_registro = 'ACTIVO'
        `, [id]);
        return rows[0];
    }
    async findByReportIds(reportIds) {
        if (reportIds.length === 0)
            return [];
        const placeholders = reportIds.map(() => "?").join(", ");
        const [rows] = await pool.query(`
            SELECT e.id_evidencia, e.url_archivo, e.tipo_archivo, e.id_reporte
            FROM evidencia e
            INNER JOIN reporte r ON r.id_reporte = e.id_reporte
            WHERE e.id_reporte IN (${placeholders})
              AND r.estado_registro = 'ACTIVO'
            ORDER BY e.id_evidencia ASC
        `, reportIds);
        return rows;
    }
    async countByReport(reportId) {
        const [rows] = await pool.query("SELECT COUNT(*) AS total FROM evidencia WHERE id_reporte = ?", [reportId]);
        return Number(rows[0].total);
    }
    async create(data) {
        const [result] = await pool.query(`
            INSERT INTO evidencia (url_archivo, tipo_archivo, id_reporte)
            VALUES (?, ?, ?)
        `, [data.url_archivo, data.tipo_archivo, data.id_reporte]);
        return result.insertId;
    }
    async updateFile(id, url, type) {
        await pool.query("UPDATE evidencia SET url_archivo = ?, tipo_archivo = ? WHERE id_evidencia = ?", [url, type, id]);
    }
    async delete(id) {
        await pool.query("DELETE FROM evidencia WHERE id_evidencia = ?", [id]);
    }
}
export default new EvidenceRepository();

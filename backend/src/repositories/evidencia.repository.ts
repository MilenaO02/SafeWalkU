import pool from "../config/database.js";
import { ResultSetHeader, RowDataPacket } from "mysql2";

export interface EvidenceRow extends RowDataPacket {
    id_evidencia: number;
    url_archivo: string;
    tipo_archivo: "IMAGEN" | "VIDEO";
    id_reporte: number;
    id_usuario: number;
    estado_reporte: string;
    estado_registro: string;
}

class EvidenceRepository {
    async findAll() {
        const [rows] = await pool.query<EvidenceRow[]>(`
            SELECT e.*, r.id_usuario, r.estado AS estado_reporte, r.estado_registro
            FROM evidencia e
            INNER JOIN reporte r ON r.id_reporte = e.id_reporte
            WHERE r.estado_registro = 'ACTIVO'
            ORDER BY e.id_evidencia DESC
        `);
        return rows;
    }

    async findById(id: number) {
        const [rows] = await pool.query<EvidenceRow[]>(`
            SELECT e.*, r.id_usuario, r.estado AS estado_reporte, r.estado_registro
            FROM evidencia e
            INNER JOIN reporte r ON r.id_reporte = e.id_reporte
            WHERE e.id_evidencia = ? AND r.estado_registro = 'ACTIVO'
        `, [id]);
        return rows[0];
    }

    async countByReport(reportId: number) {
        const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT COUNT(*) AS total FROM evidencia WHERE id_reporte = ?",
            [reportId]
        );
        return Number(rows[0].total);
    }

    async create(data: { url_archivo: string; tipo_archivo: "IMAGEN" | "VIDEO"; id_reporte: number }) {
        const [result] = await pool.query<ResultSetHeader>(`
            INSERT INTO evidencia (url_archivo, tipo_archivo, id_reporte)
            VALUES (?, ?, ?)
        `, [data.url_archivo, data.tipo_archivo, data.id_reporte]);
        return result.insertId;
    }

    async updateFile(id: number, url: string, type: "IMAGEN" | "VIDEO") {
        await pool.query(
            "UPDATE evidencia SET url_archivo = ?, tipo_archivo = ? WHERE id_evidencia = ?",
            [url, type, id]
        );
    }

    async delete(id: number) {
        await pool.query("DELETE FROM evidencia WHERE id_evidencia = ?", [id]);
    }
}

export default new EvidenceRepository();

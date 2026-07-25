import pool from "../config/database.js";
import { ResultSetHeader, RowDataPacket } from "mysql2";

export interface ReportRow extends RowDataPacket {
    id_reporte: number;
    descripcion: string;
    fecha_reporte: Date;
    nivel_riesgo: "BAJO" | "MEDIO" | "ALTO";
    estado: "PENDIENTE" | "VALIDADO" | "RECHAZADO" | "DUPLICADO" | "CANCELADO";
    tipo_reporte: "INCIDENTE" | "SOS_PANICO";
    id_usuario: number;
    id_ubicacion: number;
    id_administrador: number | null;
    estado_registro: "ACTIVO" | "INACTIVO";
}

type CreateReportInput = {
    descripcion: string;
    nivel_riesgo: "BAJO" | "MEDIO" | "ALTO";
    id_usuario: number;
    id_ubicacion: number;
};

class ReportRepository {
    async findAll(userId?: number) {
        const [rows] = await pool.query<ReportRow[]>(`
            SELECT r.id_reporte, r.descripcion, r.fecha_reporte, r.nivel_riesgo,
                   r.estado, r.tipo_reporte, r.id_usuario, r.id_ubicacion,
                   r.id_administrador, u.nombre, u.apellido,
                   ub.nombre AS ubicacion
            FROM reporte r
            INNER JOIN usuario u ON r.id_usuario = u.id_usuario
            INNER JOIN ubicacion ub ON r.id_ubicacion = ub.id_ubicacion
            WHERE r.estado_registro = 'ACTIVO'
              AND (? IS NULL OR r.id_usuario = ?)
            ORDER BY r.fecha_reporte DESC
        `, [userId ?? null, userId ?? null]);
        return rows;
    }

    async findById(id: number) {
        const [rows] = await pool.query<ReportRow[]>(`
            SELECT r.id_reporte, r.descripcion, r.fecha_reporte, r.nivel_riesgo,
                   r.estado, r.tipo_reporte, r.id_usuario, r.id_ubicacion,
                   r.id_administrador, r.estado_registro,
                   u.nombre, u.apellido, ub.nombre AS ubicacion
            FROM reporte r
            INNER JOIN usuario u ON r.id_usuario = u.id_usuario
            INNER JOIN ubicacion ub ON r.id_ubicacion = ub.id_ubicacion
            WHERE r.id_reporte = ? AND r.estado_registro = 'ACTIVO'
        `, [id]);
        return rows[0];
    }

    async locationExists(id: number) {
        const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT 1 FROM ubicacion WHERE id_ubicacion = ? LIMIT 1",
            [id]
        );
        return rows.length > 0;
    }

    async findActiveSOSByUser(userId: number) {
        const [rows] = await pool.query<ReportRow[]>(`
            SELECT id_reporte, descripcion, fecha_reporte, nivel_riesgo,
                   estado, tipo_reporte, id_usuario, id_ubicacion,
                   id_administrador, estado_registro
            FROM reporte
            WHERE id_usuario = ? AND tipo_reporte = 'SOS_PANICO'
              AND estado = 'PENDIENTE' AND estado_registro = 'ACTIVO'
            ORDER BY fecha_reporte DESC
            LIMIT 1
        `, [userId]);
        return rows[0];
    }

    async findAdministratorId(userId: number) {
        const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT id_administrador FROM administrador WHERE id_usuario = ? LIMIT 1",
            [userId]
        );
        return rows[0]?.id_administrador as number | undefined;
    }

    async create(report: CreateReportInput) {
        const [result] = await pool.query<ResultSetHeader>(`
            INSERT INTO reporte
                (descripcion, nivel_riesgo, estado, tipo_reporte, id_usuario, id_ubicacion)
            VALUES (?, ?, 'PENDIENTE', 'INCIDENTE', ?, ?)
        `, [report.descripcion, report.nivel_riesgo, report.id_usuario, report.id_ubicacion]);
        return result.insertId;
    }

    async update(id: number, report: Partial<ReportRow>, adminId: number) {
        const reviewedStates = ["VALIDADO", "RECHAZADO", "DUPLICADO"];
        const nextAdminId = report.estado && reviewedStates.includes(report.estado) ? adminId : null;

        await pool.query(`
            UPDATE reporte
            SET descripcion = COALESCE(?, descripcion),
                nivel_riesgo = COALESCE(?, nivel_riesgo),
                estado = COALESCE(?, estado),
                id_administrador = CASE
                    WHEN ? IS NOT NULL THEN ?
                    WHEN ? = 'PENDIENTE' THEN NULL
                    ELSE id_administrador
                END
            WHERE id_reporte = ? AND estado_registro = 'ACTIVO'
        `, [
            report.descripcion ?? null,
            report.nivel_riesgo ?? null,
            report.estado ?? null,
            nextAdminId,
            nextAdminId,
            report.estado ?? null,
            id
        ]);
    }

    async delete(id: number) {
        await pool.query(
            "UPDATE reporte SET estado_registro = 'INACTIVO' WHERE id_reporte = ?",
            [id]
        );
    }

    async findRiskZonesByCity(ciudad: string) {
        const [rows] = await pool.query<RowDataPacket[]>(`
            SELECT r.id_reporte, r.descripcion, r.nivel_riesgo, r.fecha_reporte,
                   ub.nombre AS ubicacion_nombre, ub.direccion, ub.ciudad, ub.radio_metros,
                   c.latitud, c.longitud
            FROM reporte r
            INNER JOIN ubicacion ub ON r.id_ubicacion = ub.id_ubicacion
            INNER JOIN coordenada c ON c.id_ubicacion = ub.id_ubicacion
            WHERE ub.ciudad = ? AND r.estado = 'VALIDADO'
              AND r.estado_registro = 'ACTIVO' AND r.tipo_reporte = 'INCIDENTE'
        `, [ciudad]);
        return rows;
    }

    async createSOS(report: { descripcion: string; id_usuario: number; id_ubicacion: number }) {
        const [result] = await pool.query<ResultSetHeader>(`
            INSERT INTO reporte
                (descripcion, nivel_riesgo, estado, tipo_reporte, id_usuario, id_ubicacion)
            VALUES (?, 'ALTO', 'PENDIENTE', 'SOS_PANICO', ?, ?)
        `, [report.descripcion, report.id_usuario, report.id_ubicacion]);
        return result.insertId;
    }

    async cancelSOS(id: number) {
        const [result] = await pool.query<ResultSetHeader>(`
            UPDATE reporte
            SET estado = 'CANCELADO'
            WHERE id_reporte = ? AND tipo_reporte = 'SOS_PANICO'
              AND estado = 'PENDIENTE' AND estado_registro = 'ACTIVO'
        `, [id]);
        return result.affectedRows;
    }

    async resolveSOS(id: number, adminId: number) {
        const [result] = await pool.query<ResultSetHeader>(`
            UPDATE reporte
            SET estado = 'VALIDADO', id_administrador = ?
            WHERE id_reporte = ? AND tipo_reporte = 'SOS_PANICO'
              AND estado = 'PENDIENTE' AND estado_registro = 'ACTIVO'
        `, [adminId, id]);
        return result.affectedRows;
    }
}

export default new ReportRepository();

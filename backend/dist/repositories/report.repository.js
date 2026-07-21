"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
class ReportRepository {
    async findAll() {
        const [rows] = await database_1.default.query(`
            SELECT

                r.id_reporte,
                r.descripcion,
                r.fecha_reporte,
                r.nivel_riesgo,
                r.estado,

                u.nombre,
                u.apellido,

                ub.nombre AS ubicacion

            FROM reporte r

            INNER JOIN usuario u

                ON r.id_usuario = u.id_usuario

            INNER JOIN ubicacion ub

                ON r.id_ubicacion = ub.id_ubicacion

            WHERE r.estado_registro='ACTIVO'

            ORDER BY r.fecha_reporte DESC
            `);
        return rows;
    }
    async findById(id) {
        const [rows] = await database_1.default.query(`
            SELECT

                r.id_reporte,
                r.descripcion,
                r.fecha_reporte,
                r.nivel_riesgo,
                r.estado,

                u.nombre,
                u.apellido,

                ub.nombre AS ubicacion

            FROM reporte r

            INNER JOIN usuario u

                ON r.id_usuario=u.id_usuario

            INNER JOIN ubicacion ub

                ON r.id_ubicacion=ub.id_ubicacion

            WHERE

                r.id_reporte=?

            AND

                r.estado_registro='ACTIVO'
            `, [id]);
        return rows[0];
    }
    async create(report) {
        const sql = `
        INSERT INTO reporte
        (

            descripcion,

            nivel_riesgo,

            estado,

            id_usuario,

            id_ubicacion

        )

        VALUES

        (

            ?,

            ?,

            'PENDIENTE',

            ?,

            ?

        )
        `;
        const [result] = await database_1.default.query(sql, [
            report.descripcion,
            report.nivel_riesgo,
            report.id_usuario,
            report.id_ubicacion
        ]);
        return result.insertId;
    }
    async update(id, report) {
        await database_1.default.query(`

            UPDATE reporte

            SET

            descripcion=?,

            nivel_riesgo=?,

            estado=?

            WHERE

            id_reporte=?

            `, [
            report.descripcion,
            report.nivel_riesgo,
            report.estado,
            id
        ]);
    }
    async delete(id) {
        await database_1.default.query(`

            UPDATE reporte

            SET

            estado_registro='INACTIVO'

            WHERE

            id_reporte=?

            `, [id]);
    }
    async findRiskZonesByCity(ciudad) {
        const [rows] = await database_1.default.query(`
            SELECT 
                r.id_reporte, r.descripcion, r.nivel_riesgo, r.fecha_reporte,
                ub.nombre AS ubicacion_nombre, ub.direccion, ub.ciudad, ub.radio_metros,
                c.latitud, c.longitud
            FROM reporte r
            INNER JOIN ubicacion ub ON r.id_ubicacion = ub.id_ubicacion
            INNER JOIN coordenada c ON c.id_ubicacion = ub.id_ubicacion
            WHERE ub.ciudad = ? AND r.estado = 'VALIDADO' AND r.estado_registro = 'ACTIVO'
            `, [ciudad]);
        return rows;
    }
    async createSOS(report) {
        const sql = `
        INSERT INTO reporte (descripcion, nivel_riesgo, estado, tipo_reporte, id_usuario, id_ubicacion)
        VALUES (?, 'ALTO', 'PENDIENTE', 'SOS_PANICO', ?, ?)
        `;
        const [result] = await database_1.default.query(sql, [report.descripcion, report.id_usuario, report.id_ubicacion]);
        return result.insertId;
    }
    async cancelSOS(id) {
        await database_1.default.query(`UPDATE reporte SET estado = 'RECHAZADO' WHERE id_reporte = ? AND tipo_reporte = 'SOS_PANICO'`, [id]);
    }
}
exports.default = new ReportRepository();

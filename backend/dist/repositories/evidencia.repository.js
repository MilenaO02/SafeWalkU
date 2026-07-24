"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
class EvidenceRepository {
    async findAll() {
        const [rows] = await database_1.default.query(`
            SELECT *

            FROM evidencia

            ORDER BY id_evidencia DESC
            `);
        return rows;
    }
    async findById(id) {
        const [rows] = await database_1.default.query(`
            SELECT *

            FROM evidencia

            WHERE id_evidencia=?
            `, [id]);
        return rows[0];
    }
    async create(data) {
        const [result] = await database_1.default.query(`
            INSERT INTO evidencia

            (

                url_archivo,

                tipo_archivo,

                id_reporte

            )

            VALUES

            (

                ?,

                ?,

                ?

            )
            `, [
            data.url_archivo,
            data.tipo_archivo,
            data.id_reporte
        ]);
        return result.insertId;
    }
    async update(id, data) {
        await database_1.default.query(`
            UPDATE evidencia

            SET

            url_archivo=?,

            tipo_archivo=?

            WHERE

            id_evidencia=?
            `, [
            data.url_archivo,
            data.tipo_archivo,
            id
        ]);
    }
    async delete(id) {
        await database_1.default.query(`
            DELETE FROM evidencia

            WHERE id_evidencia=?
            `, [id]);
    }
}
exports.default = new EvidenceRepository();

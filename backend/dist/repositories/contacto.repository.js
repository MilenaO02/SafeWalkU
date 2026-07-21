"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
class ContactoRepository {
    async findByUserId(id_usuario) {
        const [rows] = await database_1.default.query(`SELECT * FROM contactoemergencia WHERE id_usuario = ? ORDER BY id_contacto DESC`, [id_usuario]);
        return rows;
    }
    async findById(id_contacto) {
        const [rows] = await database_1.default.query(`SELECT * FROM contactoemergencia WHERE id_contacto = ?`, [id_contacto]);
        return rows[0];
    }
    async create(data) {
        const [result] = await database_1.default.query(`INSERT INTO contactoemergencia (nombre, telefono, parentesco, id_usuario) VALUES (?, ?, ?, ?)`, [data.nombre, data.telefono, data.parentesco, data.id_usuario]);
        return result.insertId;
    }
    async update(id_contacto, data) {
        await database_1.default.query(`UPDATE contactoemergencia SET 
                nombre = COALESCE(?, nombre), 
                telefono = COALESCE(?, telefono), 
                parentesco = COALESCE(?, parentesco) 
            WHERE id_contacto = ?`, [data.nombre ?? null, data.telefono ?? null, data.parentesco ?? null, id_contacto]);
        return this.findById(id_contacto);
    }
    async delete(id_contacto) {
        await database_1.default.query(`DELETE FROM contactoemergencia WHERE id_contacto = ?`, [id_contacto]);
    }
}
exports.default = new ContactoRepository();

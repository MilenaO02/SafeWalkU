"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
class UserRepository {
    async findAll() {
        const [rows] = await database_1.default.query(`

        SELECT

            id_usuario,

            nombre,

            apellido,

            correo,

            rol,

            estado,

            fecha_registro

        FROM usuario

        WHERE estado='ACTIVO'

        ORDER BY id_usuario

        `);
        return rows;
    }
    async findById(id) {
        const [rows] = await database_1.default.query(`

        SELECT

            id_usuario,

            nombre,

            apellido,

            correo,

            rol,

            estado,

            fecha_registro,

            foto_perfil

        FROM usuario

        WHERE id_usuario=?

        AND estado='ACTIVO'

        `, [id]);
        return rows[0];
    }
    async findByEmail(correo) {
        const [rows] = await database_1.default.query("SELECT * FROM usuario WHERE correo=?", [correo]);
        return rows[0];
    }
    async create(usuario) {
        const [result] = await database_1.default.query(`INSERT INTO usuario
            (
                nombre,
                apellido,
                correo,
                contrasena,
                rol
            )
            VALUES (?,?,?,?,?)`, [
            usuario.nombre,
            usuario.apellido,
            usuario.correo,
            usuario.contrasena,
            usuario.rol
        ]);
        return result.insertId;
    }
    async update(id, usuario) {
        // Buscar el usuario actual
        const actual = await this.findById(id);
        if (!actual) {
            throw new Error("Usuario no encontrado");
        }
        await database_1.default.query(`
        UPDATE usuario
        SET
            nombre = ?,
            apellido = ?,
            correo = ?,
            rol = ?
        WHERE
            id_usuario = ?
        AND
            estado = 'ACTIVO'
        `, [
            usuario.nombre ?? actual.nombre,
            usuario.apellido ?? actual.apellido,
            usuario.correo ?? actual.correo,
            usuario.rol ?? actual.rol,
            id
        ]);
        return this.findById(id);
    }
    async delete(id) {
        await database_1.default.query(`

        UPDATE usuario

        SET estado='INACTIVO'

        WHERE id_usuario=?

        `, [id]);
    }
    async updateFotoPerfil(id, foto_perfil) {
        await database_1.default.query(`UPDATE usuario SET foto_perfil = ? WHERE id_usuario = ?`, [foto_perfil, id]);
        return this.findById(id);
    }
}
exports.default = new UserRepository();

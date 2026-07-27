import pool from "../config/database.js";
class UserRepository {
    async findAvailableRoles(id) {
        const [rows] = await pool.query(`
            SELECT
                u.rol,
                EXISTS(
                    SELECT 1
                    FROM administrador a
                    WHERE a.id_usuario = u.id_usuario
                ) AS es_administrador
            FROM usuario u
            WHERE u.id_usuario = ?
              AND u.estado = 'ACTIVO'
            `, [id]);
        if (!rows[0]) {
            return [];
        }
        const roles = new Set([rows[0].rol]);
        if (Boolean(rows[0].es_administrador)) {
            roles.add("ADMINISTRADOR");
        }
        return [...roles];
    }
    async findAll() {
        const [rows] = await pool.query(`

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
        const [rows] = await pool.query(`

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
        const [rows] = await pool.query("SELECT * FROM usuario WHERE correo=?", [correo]);
        return rows[0];
    }
    async create(usuario) {
        const [result] = await pool.query(`INSERT INTO usuario
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
        await pool.query(`
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
        const [result] = await pool.query(`

        UPDATE usuario

        SET estado='INACTIVO'

        WHERE id_usuario=?

        AND estado='ACTIVO'

        `, [id]);
        return result.affectedRows === 1;
    }
    async updateFotoPerfil(id, foto_perfil) {
        await pool.query(`UPDATE usuario SET foto_perfil = ? WHERE id_usuario = ?`, [foto_perfil, id]);
        return this.findById(id);
    }
}
export default new UserRepository();

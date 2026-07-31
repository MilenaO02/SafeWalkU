import pool from "../config/database.js";
import { ResultSetHeader } from "mysql2";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";

export interface Usuario {

    id_usuario?: number;

    nombre: string;

    apellido: string;

    correo: string;

    contrasena: string;

    rol: "ESTUDIANTE" | "ADMINISTRADOR";

    foto_perfil?: string | null;

}

export type UserRole = Usuario["rol"];

class UserRepository {

    async findAvailableRoles(id: number): Promise<UserRole[]> {

        const [rows]: any = await pool.query(

            `
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
            `,

            [id]

        );

        if (!rows[0]) {
            return [];
        }

        // Toda cuenta activa puede usar el modo estudiante. El modo de
        // administración exige que el rol y su perfil administrativo sigan
        // vigentes; así un perfil histórico no conserva permisos por sí solo.
        const roles = new Set<UserRole>(["ESTUDIANTE"]);
        if (rows[0].rol === "ADMINISTRADOR" && Boolean(rows[0].es_administrador)) {
            roles.add("ADMINISTRADOR");
        }

        return [...roles];

    }

    async findAll() {

    const [rows]: any = await pool.query(

        `

        SELECT

            id_usuario,

            nombre,

            apellido,

            correo,

            rol,

            estado,

            fecha_registro

        FROM usuario

        ORDER BY id_usuario

        `

    );

    return rows;

}

    async findById(id:number){

    const [rows]:any=await pool.query(

        `

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

        `,

        [id]

    );

    return rows[0];

}

    async findByEmail(correo: string) {

        const [rows]: any = await pool.query(

            "SELECT * FROM usuario WHERE correo=?",

            [correo]

        );

        return rows[0];

    }

    async create(usuario: Usuario) {

        const [result]: any = await pool.query(

            `INSERT INTO usuario
            (
                nombre,
                apellido,
                correo,
                contrasena,
                rol
            )
            VALUES (?,?,?,?,?)`,

            [

                usuario.nombre,

                usuario.apellido,

                usuario.correo,

                usuario.contrasena,

                usuario.rol

            ]

        );

        return result.insertId;

    }

    async update(id: number, usuario: Partial<Usuario>) {

    // Buscar el usuario actual
    const actual = await this.findById(id);

    if (!actual) {
        throw new Error("Usuario no encontrado");
    }

    await pool.query(

        `
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
        `,

        [

            usuario.nombre ?? actual.nombre,

            usuario.apellido ?? actual.apellido,

            usuario.correo ?? actual.correo,

            usuario.rol ?? actual.rol,

            id

        ]

    );

    return this.findById(id);

}

    async delete(id:number){

    const [result] = await pool.query<ResultSetHeader>(

        `

        UPDATE usuario

        SET estado='INACTIVO'

        WHERE id_usuario=?

        AND estado='ACTIVO'

        `,

        [id]

    );

    return result.affectedRows === 1;

}

    async reactivate(id: number) {

    const [result] = await pool.query<ResultSetHeader>(

        `

        UPDATE usuario

        SET estado='ACTIVO'

        WHERE id_usuario=?

        AND estado='INACTIVO'

        `,

        [id]

    );

    return result.affectedRows === 1;

}

    async updateFotoPerfil(id: number, foto_perfil: string) {

        await pool.query(

            `UPDATE usuario SET foto_perfil = ? WHERE id_usuario = ?`,

            [foto_perfil, id]

        );

        return this.findById(id);

    }

    async setAdministratorRole(id: number, makeAdministrator: boolean) {
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            const [targetRows] = await connection.query<RowDataPacket[]>(
                `SELECT u.id_usuario, u.rol, u.estado, a.id_administrador
                 FROM usuario u
                 LEFT JOIN administrador a ON a.id_usuario = u.id_usuario
                 WHERE u.id_usuario = ?
                 FOR UPDATE`,
                [id]
            );
            const target = targetRows[0];

            if (!target || target.estado !== "ACTIVO") {
                throw new Error("Usuario activo no encontrado");
            }

            const hasAdministratorProfile = Boolean(target.id_administrador);
            const isAdministrator = target.rol === "ADMINISTRADOR" && hasAdministratorProfile;

            if (makeAdministrator) {
                if (isAdministrator) throw new Error("El usuario ya es administrador");

                await connection.query(
                    "UPDATE usuario SET rol = 'ADMINISTRADOR' WHERE id_usuario = ?",
                    [id]
                );

                if (!hasAdministratorProfile) {
                    await connection.query(
                        `INSERT INTO administrador (id_usuario, cargo, fecha_asignacion)
                         VALUES (?, 'Administrador del sistema SafeWalk U', CURDATE())`,
                        [id]
                    );
                }
            } else {
                if (!isAdministrator) throw new Error("El usuario no es administrador");

                const [administratorRows] = await connection.query<RowDataPacket[]>(
                    `SELECT u.id_usuario
                     FROM usuario u
                     INNER JOIN administrador a ON a.id_usuario = u.id_usuario
                     WHERE u.estado = 'ACTIVO' AND u.rol = 'ADMINISTRADOR'
                     FOR UPDATE`
                );

                if (administratorRows.length <= 1) {
                    throw new Error("Debe existir al menos un administrador activo");
                }

                // El perfil de administrador se conserva para no romper las
                // claves foráneas del historial de reportes y zonas. Los
                // permisos quedan revocados porque usuario.rol pasa a estudiante.
                await connection.query(
                    "UPDATE usuario SET rol = 'ESTUDIANTE' WHERE id_usuario = ?",
                    [id]
                );
            }

            await connection.commit();
            return this.findById(id);
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

}

export default new UserRepository();

import pool from "../config/database";

export interface Usuario {

    id_usuario?: number;

    nombre: string;

    apellido: string;

    correo: string;

    contrasena: string;

    rol: "ESTUDIANTE" | "ADMINISTRADOR";

    foto_perfil?: string | null;

}

class UserRepository {

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

        FROM Usuario

        WHERE estado='ACTIVO'

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

        FROM Usuario

        WHERE id_usuario=?

        AND estado='ACTIVO'

        `,

        [id]

    );

    return rows[0];

}

    async findByEmail(correo: string) {

        const [rows]: any = await pool.query(

            "SELECT * FROM Usuario WHERE correo=?",

            [correo]

        );

        return rows[0];

    }

    async create(usuario: Usuario) {

        const [result]: any = await pool.query(

            `INSERT INTO Usuario
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
        UPDATE Usuario
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

    await pool.query(

        `

        UPDATE Usuario

        SET estado='INACTIVO'

        WHERE id_usuario=?

        `,

        [id]

    );

}

    async updateFotoPerfil(id: number, foto_perfil: string) {

        await pool.query(

            `UPDATE Usuario SET foto_perfil = ? WHERE id_usuario = ?`,

            [foto_perfil, id]

        );

        return this.findById(id);

    }

}

export default new UserRepository();
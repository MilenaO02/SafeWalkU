import pool from "../config/database";

class RouteRepository {

    async findAll() {

        const [rows]: any = await pool.query(

            `
            SELECT *

            FROM Ruta

            ORDER BY id_ruta DESC
            `
        );

        return rows;

    }

    async findById(id: number) {

        const [rows]: any = await pool.query(

            `
            SELECT *

            FROM Ruta

            WHERE id_ruta = ?
            `,

            [id]

        );

        return rows[0];

    }

    async create(route: any) {

        const [result]: any = await pool.query(

            `
            INSERT INTO Ruta

            (

                nombre_ruta,

                descripcion,

                nivel_seguridad,

                tiempo_estimado

            )

            VALUES

            (

                ?,

                ?,

                ?,

                ?

            )
            `,

            [

                route.nombre_ruta,

                route.descripcion,

                route.nivel_seguridad,

                route.tiempo_estimado

            ]

        );

        return result.insertId;

    }

    async update(id: number, route: any) {

        await pool.query(

            `
            UPDATE Ruta

            SET

            nombre_ruta=?,

            descripcion=?,

            nivel_seguridad=?,

            tiempo_estimado=?

            WHERE

            id_ruta=?
            `,

            [

                route.nombre_ruta,

                route.descripcion,

                route.nivel_seguridad,

                route.tiempo_estimado,

                id

            ]

        );

    }

    async delete(id: number) {

        await pool.query(

            `

            DELETE FROM Ruta

            WHERE id_ruta=?

            `,

            [id]

        );

    }

}

export default new RouteRepository();
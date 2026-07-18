import pool from "../config/database";

class EvidenceRepository {

    async findAll() {

        const [rows]: any = await pool.query(

            `
            SELECT *

            FROM evidencia

            ORDER BY id_evidencia DESC
            `
        );

        return rows;

    }

    async findById(id:number){

        const [rows]:any=await pool.query(

            `
            SELECT *

            FROM evidencia

            WHERE id_evidencia=?
            `,

            [id]

        );

        return rows[0];

    }

    async create(data:any){

        const [result]:any=await pool.query(

            `
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
            `,

            [

                data.url_archivo,

                data.tipo_archivo,

                data.id_reporte

            ]

        );

        return result.insertId;

    }

    async update(id:number,data:any){

        await pool.query(

            `
            UPDATE evidencia

            SET

            url_archivo=?,

            tipo_archivo=?

            WHERE

            id_evidencia=?
            `,

            [

                data.url_archivo,

                data.tipo_archivo,

                id

            ]

        );

    }

    async delete(id:number){

        await pool.query(

            `
            DELETE FROM evidencia

            WHERE id_evidencia=?
            `,

            [id]

        );

    }

}

export default new EvidenceRepository();
import pool from "../config/database";

class ReportRepository {

    async findAll() {

        const [rows]: any = await pool.query(

            `
            SELECT

                r.id_reporte,
                r.descripcion,
                r.fecha_reporte,
                r.nivel_riesgo,
                r.estado,

                u.nombre,
                u.apellido,

                ub.nombre AS ubicacion

            FROM Reporte r

            INNER JOIN Usuario u

                ON r.id_usuario = u.id_usuario

            INNER JOIN Ubicacion ub

                ON r.id_ubicacion = ub.id_ubicacion

            WHERE r.estado_registro='ACTIVO'

            ORDER BY r.fecha_reporte DESC
            `
        );

        return rows;
    }

    async findById(id: number) {

        const [rows]: any = await pool.query(

            `
            SELECT

                r.id_reporte,
                r.descripcion,
                r.fecha_reporte,
                r.nivel_riesgo,
                r.estado,

                u.nombre,
                u.apellido,

                ub.nombre AS ubicacion

            FROM Reporte r

            INNER JOIN Usuario u

                ON r.id_usuario=u.id_usuario

            INNER JOIN Ubicacion ub

                ON r.id_ubicacion=ub.id_ubicacion

            WHERE

                r.id_reporte=?

            AND

                r.estado_registro='ACTIVO'
            `,

            [id]

        );

        return rows[0];
    }

    async create(report: any) {

        const sql =

        `
        INSERT INTO Reporte
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

        const [result]: any = await pool.query(

            sql,

            [

                report.descripcion,

                report.nivel_riesgo,

                report.id_usuario,

                report.id_ubicacion

            ]

        );

        return result.insertId;

    }

    async update(id:number,report:any){

        await pool.query(

            `

            UPDATE Reporte

            SET

            descripcion=?,

            nivel_riesgo=?,

            estado=?

            WHERE

            id_reporte=?

            `,

            [

                report.descripcion,

                report.nivel_riesgo,

                report.estado,

                id

            ]

        );

    }

    async delete(id:number){

        await pool.query(

            `

            UPDATE Reporte

            SET

            estado_registro='INACTIVO'

            WHERE

            id_reporte=?

            `,

            [id]

        );

    }

    async findRiskZonesByCity(ciudad: string) {
        const [rows]: any = await pool.query(
            `
            SELECT 
                r.id_reporte, r.descripcion, r.nivel_riesgo, r.fecha_reporte,
                ub.nombre AS ubicacion_nombre, ub.direccion, ub.ciudad, ub.radio_metros,
                c.latitud, c.longitud
            FROM Reporte r
            INNER JOIN Ubicacion ub ON r.id_ubicacion = ub.id_ubicacion
            INNER JOIN Coordenada c ON c.id_ubicacion = ub.id_ubicacion
            WHERE ub.ciudad = ? AND r.estado = 'VALIDADO' AND r.estado_registro = 'ACTIVO'
            `,
            [ciudad]
        );
        return rows;
    }

    async createSOS(report: any) {
        const sql = `
        INSERT INTO Reporte (descripcion, nivel_riesgo, estado, tipo_reporte, id_usuario, id_ubicacion)
        VALUES (?, 'ALTO', 'PENDIENTE', 'SOS_PANICO', ?, ?)
        `;
        const [result]: any = await pool.query(sql, [report.descripcion, report.id_usuario, report.id_ubicacion]);
        return result.insertId;
    }

    async cancelSOS(id: number) {
        await pool.query(
            `UPDATE Reporte SET estado = 'RECHAZADO' WHERE id_reporte = ? AND tipo_reporte = 'SOS_PANICO'`,
            [id]
        );
    }

}

export default new ReportRepository();
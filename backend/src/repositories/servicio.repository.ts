import pool from "../config/database.js";

class ServicioRepository {
    async findAll() {
        const [rows]: any = await pool.query(
            `SELECT s.*, u.nombre AS ubicacion_nombre, u.direccion, c.latitud, c.longitud 
             FROM servicioemergencia s
             LEFT JOIN ubicacion u ON s.id_ubicacion = u.id_ubicacion
             LEFT JOIN coordenada c ON c.id_ubicacion = u.id_ubicacion
             WHERE u.estado_registro = 'ACTIVO'
             ORDER BY s.nombre ASC`
        );
        return rows;
    }

    async findById(id: number) {
        const [rows]: any = await pool.query(
            `SELECT s.*, u.nombre AS ubicacion_nombre, u.direccion 
             FROM servicioemergencia s
             LEFT JOIN ubicacion u ON s.id_ubicacion = u.id_ubicacion
             WHERE s.id_servicio = ? AND u.estado_registro = 'ACTIVO'`,
            [id]
        );
        return rows[0];
    }
}

export default new ServicioRepository();

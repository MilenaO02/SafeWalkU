import pool from "../config/database.js";
class ServicioRepository {
    async findAll() {
        const [rows] = await pool.query(`SELECT s.*, u.nombre AS ubicacion_nombre, u.direccion, c.latitud, c.longitud 
             FROM servicioemergencia s
             LEFT JOIN ubicacion u ON s.id_ubicacion = u.id_ubicacion
             LEFT JOIN coordenada c ON c.id_ubicacion = u.id_ubicacion
             ORDER BY s.id_servicio DESC`);
        return rows;
    }
    async findById(id) {
        const [rows] = await pool.query(`SELECT s.*, u.nombre AS ubicacion_nombre, u.direccion 
             FROM servicioemergencia s
             LEFT JOIN ubicacion u ON s.id_ubicacion = u.id_ubicacion
             WHERE s.id_servicio = ?`, [id]);
        return rows[0];
    }
}
export default new ServicioRepository();

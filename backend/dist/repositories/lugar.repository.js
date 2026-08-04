import pool from "../config/database.js";
class LugarRepository {
    async findAll() {
        const [rows] = await pool.query(`SELECT l.*, u.nombre AS ubicacion_nombre, u.direccion, c.latitud, c.longitud 
             FROM lugarseguro l
             LEFT JOIN ubicacion u ON l.id_ubicacion = u.id_ubicacion
             LEFT JOIN coordenada c ON c.id_ubicacion = u.id_ubicacion
             WHERE u.estado_registro = 'ACTIVO' AND u.tipo_zona = 'LUGAR_SEGURO'
             ORDER BY u.nombre ASC`);
        return rows;
    }
}
export default new LugarRepository();

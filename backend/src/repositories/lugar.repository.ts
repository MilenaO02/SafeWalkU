import pool from "../config/database";

class LugarRepository {
    async findAll() {
        const [rows]: any = await pool.query(
            `SELECT l.*, u.nombre AS ubicacion_nombre, u.direccion, c.latitud, c.longitud 
             FROM lugarseguro l
             LEFT JOIN ubicacion u ON l.id_ubicacion = u.id_ubicacion
             LEFT JOIN coordenada c ON c.id_ubicacion = u.id_ubicacion
             ORDER BY l.id_lugar_seguro DESC`
        );
        return rows;
    }
}

export default new LugarRepository();

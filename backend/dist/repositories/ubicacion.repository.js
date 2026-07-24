import pool from "../config/database.js";
class UbicacionRepository {
    async findAll() {
        const [rows] = await pool.query(`
            SELECT u.*, c.latitud, c.longitud, c.verificada, c.fuente
            FROM ubicacion u
            LEFT JOIN coordenada c ON c.id_ubicacion = u.id_ubicacion
            ORDER BY u.nombre
        `);
        return rows;
    }
    async findByQuery(query) {
        const [rows] = await pool.query(`SELECT u.*, c.latitud, c.longitud, c.verificada, c.fuente,
                    CASE
                        WHEN COUNT(DISTINCT l.id_lugar_seguro) > 0 THEN 'LUGAR_SEGURO'
                        ELSE 'SERVICIO_EMERGENCIA'
                    END AS categoria_segura,
                    COALESCE(MAX(l.descripcion), MAX(s.tipo)) AS detalle_seguridad,
                    MAX(s.telefono) AS telefono
             FROM ubicacion u
             INNER JOIN coordenada c ON c.id_ubicacion = u.id_ubicacion
             LEFT JOIN lugarseguro l ON l.id_ubicacion = u.id_ubicacion
             LEFT JOIN servicioemergencia s ON s.id_ubicacion = u.id_ubicacion
             WHERE (l.id_lugar_seguro IS NOT NULL OR s.id_servicio IS NOT NULL)
               AND c.verificada = 1
               AND (u.nombre LIKE ? OR u.direccion LIKE ? OR l.nombre LIKE ? OR s.nombre LIKE ?)
             GROUP BY u.id_ubicacion, c.latitud, c.longitud, c.verificada, c.fuente
             ORDER BY categoria_segura, u.nombre LIMIT 10`, [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`]);
        return rows;
    }
    async updateCoordinates(id, data) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const [result] = await connection.query("UPDATE ubicacion SET nombre = ?, direccion = ? WHERE id_ubicacion = ?", [data.nombre, data.direccion, id]);
            if (!result.affectedRows)
                throw new Error("Ubicacion no encontrada");
            await connection.query(`
                INSERT INTO coordenada (latitud, longitud, id_ubicacion, verificada, fuente)
                VALUES (?, ?, ?, 1, 'Editor administrativo SafeWalk U')
                ON DUPLICATE KEY UPDATE latitud = VALUES(latitud), longitud = VALUES(longitud),
                    verificada = 1, fuente = 'Editor administrativo SafeWalk U'
            `, [data.latitud, data.longitud, id]);
            await connection.commit();
        }
        catch (error) {
            await connection.rollback();
            throw error;
        }
        finally {
            connection.release();
        }
    }
}
export default new UbicacionRepository();

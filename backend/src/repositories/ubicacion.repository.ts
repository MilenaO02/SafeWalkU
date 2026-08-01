import pool from "../config/database.js";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export interface UbicacionRow extends RowDataPacket {
    id_ubicacion: number;
    nombre: string;
    direccion: string;
    ciudad: string;
    radio_metros: number;
    tipo_zona: string;
}

class UbicacionRepository {
    async findAll(): Promise<UbicacionRow[]> {
        const [rows] = await pool.query<UbicacionRow[]>(`
            SELECT u.*, c.latitud, c.longitud, c.verificada, c.fuente,
                   CASE
                       WHEN COUNT(DISTINCT l.id_lugar_seguro) > 0 THEN 'LUGAR_SEGURO'
                       WHEN COUNT(DISTINCT s.id_servicio) > 0 THEN 'SERVICIO_EMERGENCIA'
                       ELSE 'UBICACION_REGISTRADA'
                   END AS categoria,
                   COALESCE(MAX(s.tipo), u.tipo_zona) AS tipo,
                   CASE WHEN c.id_coordenada IS NULL THEN 'SIN_COORDENADAS'
                        WHEN c.verificada = 1 THEN 'VERIFICADA' ELSE 'PENDIENTE' END AS estado
            FROM ubicacion u
            LEFT JOIN coordenada c ON c.id_ubicacion = u.id_ubicacion
            LEFT JOIN lugarseguro l ON l.id_ubicacion = u.id_ubicacion
            LEFT JOIN servicioemergencia s ON s.id_ubicacion = u.id_ubicacion
            WHERE u.estado_registro = 'ACTIVO'
            GROUP BY u.id_ubicacion, u.nombre, u.direccion, u.ciudad, u.radio_metros, u.tipo_zona,
                     c.id_coordenada, c.latitud, c.longitud, c.verificada, c.fuente
            ORDER BY u.nombre
        `);
        return rows;
    }

    async findByQuery(query: string): Promise<UbicacionRow[]> {
        const [rows] = await pool.query<UbicacionRow[]>(
            `SELECT u.*, c.latitud, c.longitud, c.verificada, c.fuente,
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
             WHERE u.estado_registro = 'ACTIVO'
               AND (l.id_lugar_seguro IS NOT NULL OR s.id_servicio IS NOT NULL)
               AND c.verificada = 1
               AND (u.nombre LIKE ? OR u.direccion LIKE ? OR l.nombre LIKE ? OR s.nombre LIKE ?)
             GROUP BY u.id_ubicacion, c.latitud, c.longitud, c.verificada, c.fuente
             ORDER BY categoria_segura, u.nombre LIMIT 10`,
            [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`]
        );
        return rows;
    }

    async updateCoordinates(id: number, data: { nombre: string; direccion: string; latitud: number; longitud: number }, adminUserId: number) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const [previousRows] = await connection.query<RowDataPacket[]>(
                "SELECT latitud, longitud FROM coordenada WHERE id_ubicacion = ? FOR UPDATE",
                [id]
            );
            const [result] = await connection.query<ResultSetHeader>(
                "UPDATE ubicacion SET nombre = ?, direccion = ? WHERE id_ubicacion = ?",
                [data.nombre, data.direccion, id]
            );
            if (!result.affectedRows) throw new Error("Ubicacion no encontrada");
            await connection.query(`
                INSERT INTO coordenada (latitud, longitud, id_ubicacion, verificada, fuente)
                VALUES (?, ?, ?, 1, 'Editor administrativo SafeWalk U')
                ON DUPLICATE KEY UPDATE latitud = VALUES(latitud), longitud = VALUES(longitud),
                    verificada = 1, fuente = 'Editor administrativo SafeWalk U'
            `, [data.latitud, data.longitud, id]);
            await connection.query(`
                INSERT INTO auditoria_coordenada
                    (id_ubicacion, id_usuario_admin, latitud_anterior, longitud_anterior, latitud_nueva, longitud_nueva)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [
                id,
                adminUserId,
                previousRows[0]?.latitud ?? null,
                previousRows[0]?.longitud ?? null,
                data.latitud,
                data.longitud
            ]);
            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async create(data: { nombre: string; direccion: string; latitud: number; longitud: number; tipo: string; radio_metros?: number }): Promise<number> {
        const connection = await pool.getConnection();
        const validEnumTypes = ['UNIVERSIDAD', 'CALLE', 'PARQUE', 'BARRIO', 'PARADERO', 'LUGAR_SEGURO', 'SERVICIO_EMERGENCIA'];
        const safeTipoZona = validEnumTypes.includes(data.tipo) ? data.tipo : 'CALLE';

        try {
            await connection.beginTransaction();
            const [result] = await connection.query<ResultSetHeader>(
                "INSERT INTO ubicacion (nombre, direccion, ciudad, radio_metros, tipo_zona) VALUES (?, ?, 'Loja', ?, ?)",
                [data.nombre, data.direccion, data.radio_metros || 50, safeTipoZona]
            );
            const newId = result.insertId;
            await connection.query(
                `INSERT INTO coordenada (latitud, longitud, id_ubicacion, verificada, fuente) VALUES (?, ?, ?, 1, 'Editor administrativo SafeWalk U')`,
                [data.latitud, data.longitud, newId]
            );
            await connection.commit();
            return newId;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async getDeleteImpact(id: number): Promise<RowDataPacket & { estado_registro: string; relaciones: RowDataPacket }> {
        const [locations] = await pool.query<RowDataPacket[]>("SELECT id_ubicacion, nombre, tipo_zona, estado_registro FROM ubicacion WHERE id_ubicacion = ?", [id]);
        if (!locations[0]) throw new Error("Ubicacion no encontrada");
        const [counts] = await pool.query<RowDataPacket[]>(`
            SELECT
              (SELECT COUNT(*) FROM coordenada WHERE id_ubicacion = ?) AS coordenadas,
              (SELECT COUNT(*) FROM reporte WHERE id_ubicacion = ?) AS reportes,
              (SELECT COUNT(*) FROM ruta_ubicacion WHERE id_ubicacion = ?) AS rutas,
              (SELECT COUNT(*) FROM lugarseguro WHERE id_ubicacion = ?) AS lugares_seguros,
              (SELECT COUNT(*) FROM servicioemergencia WHERE id_ubicacion = ?) AS servicios_emergencia,
              (SELECT COUNT(*) FROM auditoria_coordenada WHERE id_ubicacion = ?) AS auditorias
        `, [id, id, id, id, id, id]);
        return { ...(locations[0] as RowDataPacket), estado_registro: String(locations[0].estado_registro), relaciones: counts[0] };
    }

    async deactivate(id: number) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const impact = await this.getDeleteImpact(id);
            if (impact.estado_registro === "INACTIVO") throw new Error("Ubicacion no encontrada");
            const [result] = await connection.query<ResultSetHeader>("UPDATE ubicacion SET estado_registro = 'INACTIVO' WHERE id_ubicacion = ? AND estado_registro = 'ACTIVO'", [id]);
            if (!result.affectedRows) throw new Error("Ubicacion no encontrada");
            await connection.commit();
            return impact;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

export default new UbicacionRepository();

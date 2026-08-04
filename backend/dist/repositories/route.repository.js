import pool from "../config/database.js";
class RouteRepository {
    async findAll() {
        const [rows] = await pool.query(`
            SELECT r.*, COUNT(DISTINCT ru.id_ruta_ubicacion) AS total_ubicaciones,
                   COUNT(DISTINCT rp.id_ruta_punto) AS total_puntos
            FROM ruta r
            LEFT JOIN ruta_ubicacion ru ON ru.id_ruta = r.id_ruta
            LEFT JOIN ruta_punto rp ON rp.id_ruta = r.id_ruta
            GROUP BY r.id_ruta
            ORDER BY r.id_ruta DESC
        `);
        return rows;
    }
    async findById(id) {
        const [routes] = await pool.query("SELECT * FROM ruta WHERE id_ruta = ?", [id]);
        if (!routes[0])
            return undefined;
        const [points] = await pool.query(`
            SELECT ru.orden_punto, u.id_ubicacion, u.nombre, u.direccion, u.ciudad,
                   c.latitud, c.longitud
            FROM ruta_ubicacion ru
            INNER JOIN ubicacion u ON u.id_ubicacion = ru.id_ubicacion
            INNER JOIN coordenada c ON c.id_ubicacion = u.id_ubicacion
            WHERE ru.id_ruta = ?
            ORDER BY ru.orden_punto
        `, [id]);
        const [trace] = await pool.query(`
            SELECT id_ruta_punto, orden_punto, latitud, longitud, tipo, observacion
            FROM ruta_punto
            WHERE id_ruta = ?
            ORDER BY orden_punto
        `, [id]);
        return { ...routes[0], puntos: points, trazado: trace };
    }
    async assertLocations(connection, ids) {
        const [rows] = await connection.query("SELECT id_ubicacion FROM ubicacion WHERE id_ubicacion IN (?)", [ids]);
        if (rows.length !== ids.length)
            throw new Error("Una o más ubicaciones de la ruta no existen");
    }
    async insertPoints(connection, routeId, ids) {
        const values = ids.map((locationId, index) => [routeId, locationId, index + 1]);
        await connection.query("INSERT INTO ruta_ubicacion (id_ruta, id_ubicacion, orden_punto) VALUES ?", [values]);
    }
    async ensureEndpointLocation(connection, endpoint) {
        const [existing] = await connection.query(`SELECT u.id_ubicacion
             FROM ubicacion u INNER JOIN coordenada c ON c.id_ubicacion = u.id_ubicacion
             WHERE u.nombre = ? AND u.direccion = ?
               AND ABS(c.latitud - ?) < 0.00000001 AND ABS(c.longitud - ?) < 0.00000001
             LIMIT 1`, [endpoint.nombre, endpoint.direccion || "", endpoint.latitud, endpoint.longitud]);
        if (existing[0])
            return Number(existing[0].id_ubicacion);
        const [location] = await connection.query(`INSERT INTO ubicacion (nombre, direccion, ciudad, radio_metros, tipo_zona)
             VALUES (?, ?, 'Loja', 50, 'CALLE')`, [endpoint.nombre, endpoint.direccion || "Ubicación de ruta"]);
        await connection.query(`INSERT INTO coordenada (latitud, longitud, id_ubicacion, verificada, fuente)
             VALUES (?, ?, ?, 1, ?)`, [endpoint.latitud, endpoint.longitud, location.insertId, `Ruta ${endpoint.fuente}`]);
        return location.insertId;
    }
    async resolveRouteLocations(connection, route) {
        if (route.ubicaciones?.length) {
            await this.assertLocations(connection, route.ubicaciones);
            return route.ubicaciones;
        }
        if (!route.origen || !route.destino)
            throw new Error("Debe indicar origen y destino de la ruta");
        return [
            await this.ensureEndpointLocation(connection, route.origen),
            await this.ensureEndpointLocation(connection, route.destino)
        ];
    }
    async insertTrace(connection, routeId, points) {
        const values = points.map((point, index) => [
            routeId,
            index + 1,
            point.latitud,
            point.longitud,
            index === 0
                ? "INICIO"
                : index === points.length - 1
                    ? "DESTINO"
                    : point.tipo === "INICIO" || point.tipo === "DESTINO"
                        ? "INTERMEDIO"
                        : point.tipo ?? "INTERMEDIO",
            point.observacion ?? null
        ]);
        await connection.query(`
            INSERT INTO ruta_punto
                (id_ruta, orden_punto, latitud, longitud, tipo, observacion)
            VALUES ?
        `, [values]);
    }
    async create(route) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const locationIds = await this.resolveRouteLocations(connection, route);
            const [result] = await connection.query(`
                INSERT INTO ruta (
                    nombre_ruta, descripcion, nivel_seguridad, tiempo_estimado,
                    origen_nombre, origen_direccion, origen_place_id,
                    destino_nombre, destino_direccion, destino_place_id,
                    distancia_m, duracion_segundos, fuente_trazado
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                route.nombre_ruta, route.descripcion ?? null, route.nivel_seguridad, route.tiempo_estimado,
                route.origen?.nombre ?? null, route.origen?.direccion ?? null, route.origen?.place_id ?? null,
                route.destino?.nombre ?? null, route.destino?.direccion ?? null, route.destino?.place_id ?? null,
                route.distancia_m ?? null, route.duracion_segundos ?? null, route.fuente_trazado ?? null
            ]);
            await this.insertPoints(connection, result.insertId, locationIds);
            await this.insertTrace(connection, result.insertId, route.puntos);
            await connection.commit();
            return result.insertId;
        }
        catch (error) {
            await connection.rollback();
            throw error;
        }
        finally {
            connection.release();
        }
    }
    async update(id, route) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const locationIds = route.ubicaciones || (route.origen && route.destino
                ? await this.resolveRouteLocations(connection, route)
                : undefined);
            await connection.query(`
                UPDATE ruta
                SET nombre_ruta = COALESCE(?, nombre_ruta),
                    descripcion = COALESCE(?, descripcion),
                    nivel_seguridad = COALESCE(?, nivel_seguridad),
                    tiempo_estimado = COALESCE(?, tiempo_estimado),
                    origen_nombre = COALESCE(?, origen_nombre),
                    origen_direccion = COALESCE(?, origen_direccion),
                    origen_place_id = COALESCE(?, origen_place_id),
                    destino_nombre = COALESCE(?, destino_nombre),
                    destino_direccion = COALESCE(?, destino_direccion),
                    destino_place_id = COALESCE(?, destino_place_id),
                    distancia_m = COALESCE(?, distancia_m),
                    duracion_segundos = COALESCE(?, duracion_segundos),
                    fuente_trazado = COALESCE(?, fuente_trazado)
                WHERE id_ruta = ?
            `, [
                route.nombre_ruta ?? null,
                route.descripcion ?? null,
                route.nivel_seguridad ?? null,
                route.tiempo_estimado ?? null,
                route.origen?.nombre ?? null, route.origen?.direccion ?? null, route.origen?.place_id ?? null,
                route.destino?.nombre ?? null, route.destino?.direccion ?? null, route.destino?.place_id ?? null,
                route.distancia_m ?? null, route.duracion_segundos ?? null, route.fuente_trazado ?? null,
                id
            ]);
            if (locationIds) {
                await connection.query("DELETE FROM ruta_ubicacion WHERE id_ruta = ?", [id]);
                await this.insertPoints(connection, id, locationIds);
            }
            if (route.puntos) {
                await connection.query("DELETE FROM ruta_punto WHERE id_ruta = ?", [id]);
                await this.insertTrace(connection, id, route.puntos);
            }
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
    async delete(id) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            await connection.query("DELETE FROM rutafavorita WHERE id_ruta = ?", [id]);
            await connection.query("DELETE FROM ruta_punto WHERE id_ruta = ?", [id]);
            await connection.query("DELETE FROM ruta_ubicacion WHERE id_ruta = ?", [id]);
            const [result] = await connection.query("DELETE FROM ruta WHERE id_ruta = ?", [id]);
            await connection.commit();
            return result.affectedRows;
        }
        catch (error) {
            await connection.rollback();
            throw error;
        }
        finally {
            connection.release();
        }
    }
    async findDestination(destinationId) {
        const [rows] = await pool.query(`
            SELECT u.id_ubicacion, u.nombre, u.direccion, c.latitud, c.longitud
            FROM ubicacion u
            INNER JOIN coordenada c ON c.id_ubicacion = u.id_ubicacion
            WHERE u.id_ubicacion = ?
        `, [destinationId]);
        return rows[0];
    }
    async findRecommendedByDestination(destinationId) {
        const [routes] = await pool.query(`
            SELECT r.*
            FROM ruta r
            INNER JOIN ruta_ubicacion ru ON ru.id_ruta = r.id_ruta
            WHERE ru.id_ubicacion = ?
              AND ru.orden_punto = (
                  SELECT MAX(last_point.orden_punto)
                  FROM ruta_ubicacion last_point
                  WHERE last_point.id_ruta = r.id_ruta
              )
            ORDER BY FIELD(r.nivel_seguridad, 'ALTO', 'MEDIO', 'BAJO'), r.tiempo_estimado
            LIMIT 1
        `, [destinationId]);
        if (!routes[0])
            return undefined;
        return this.findById(routes[0].id_ruta);
    }
}
export default new RouteRepository();

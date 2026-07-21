"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
class RouteRepository {
    async findAll() {
        const [rows] = await database_1.default.query(`
            SELECT *

            FROM ruta

            ORDER BY id_ruta DESC
            `);
        return rows;
    }
    async findById(id) {
        const [rows] = await database_1.default.query(`
            SELECT *

            FROM ruta

            WHERE id_ruta = ?
            `, [id]);
        return rows[0];
    }
    async create(route) {
        const [result] = await database_1.default.query(`
            INSERT INTO ruta

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
            `, [
            route.nombre_ruta,
            route.descripcion,
            route.nivel_seguridad,
            route.tiempo_estimado
        ]);
        return result.insertId;
    }
    async update(id, route) {
        await database_1.default.query(`
            UPDATE ruta

            SET

            nombre_ruta=?,

            descripcion=?,

            nivel_seguridad=?,

            tiempo_estimado=?

            WHERE

            id_ruta=?
            `, [
            route.nombre_ruta,
            route.descripcion,
            route.nivel_seguridad,
            route.tiempo_estimado,
            id
        ]);
    }
    async delete(id) {
        await database_1.default.query(`

            DELETE FROM ruta

            WHERE id_ruta=?

            `, [id]);
    }
    async trazarRuta(origen_lat, origen_lng, destino_id) {
        const [rows] = await database_1.default.query(`SELECT latitud, longitud FROM coordenada WHERE id_ubicacion = ?`, [destino_id]);
        if (rows.length === 0)
            throw new Error("Destino no encontrado");
        const dest = rows[0];
        const points = [
            [origen_lat, origen_lng],
            [(origen_lat + Number(dest.latitud)) / 2 + 0.0005, (origen_lng + Number(dest.longitud)) / 2 + 0.0005],
            [Number(dest.latitud), Number(dest.longitud)]
        ];
        return {
            tiempo_estimado: 5,
            distancia_m: 500,
            ruta_segura: true,
            coordenadas: points
        };
    }
}
exports.default = new RouteRepository();

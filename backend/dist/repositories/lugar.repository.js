"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
class LugarRepository {
    async findAll() {
        const [rows] = await database_1.default.query(`SELECT l.*, u.nombre AS ubicacion_nombre, u.direccion, c.latitud, c.longitud 
             FROM lugarseguro l
             LEFT JOIN ubicacion u ON l.id_ubicacion = u.id_ubicacion
             LEFT JOIN coordenada c ON c.id_ubicacion = u.id_ubicacion
             ORDER BY l.id_lugar_seguro DESC`);
        return rows;
    }
}
exports.default = new LugarRepository();

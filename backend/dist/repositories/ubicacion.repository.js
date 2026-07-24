"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
class UbicacionRepository {
    async findByQuery(query) {
        const [rows] = await database_1.default.query("SELECT * FROM ubicacion WHERE nombre LIKE ? OR direccion LIKE ? LIMIT 10", [`%${query}%`, `%${query}%`]);
        return rows;
    }
}
exports.default = new UbicacionRepository();

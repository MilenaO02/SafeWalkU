"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
class DashboardService {
    async getMetrics() {
        const [reportes] = await database_1.default.query(`SELECT COUNT(*) as total FROM reporte`);
        const [sosActivos] = await database_1.default.query(`SELECT COUNT(*) as total FROM reporte WHERE tipo_reporte='SOS_PANICO' AND estado='PENDIENTE'`);
        const [usuarios] = await database_1.default.query(`SELECT COUNT(*) as total FROM usuario`);
        const [rutas] = await database_1.default.query(`SELECT COUNT(*) as total FROM ruta`);
        return {
            totalReportes: reportes[0].total,
            sosActivos: sosActivos[0].total,
            usuariosRegistrados: usuarios[0].total,
            rutasRiesgo: rutas[0].total
        };
    }
}
exports.default = new DashboardService();

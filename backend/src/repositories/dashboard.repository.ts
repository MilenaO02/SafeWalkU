import pool from "../config/database.js";
import { RowDataPacket } from "mysql2";

interface CountRow extends RowDataPacket {
    total: number;
}

class DashboardRepository {
    async getMetrics() {
        const [reportes] = await pool.query<CountRow[]>(
            "SELECT COUNT(*) AS total FROM reporte WHERE estado_registro = 'ACTIVO'"
        );
        const [sosActivos] = await pool.query<CountRow[]>(
            "SELECT COUNT(*) AS total FROM reporte WHERE tipo_reporte = 'SOS_PANICO' AND estado = 'PENDIENTE' AND estado_registro = 'ACTIVO'"
        );
        const [usuarios] = await pool.query<CountRow[]>(
            "SELECT COUNT(*) AS total FROM usuario WHERE estado = 'ACTIVO'"
        );
        const [rutas] = await pool.query<CountRow[]>(
            "SELECT COUNT(*) AS total FROM ruta"
        );

        return {
            totalReportes: reportes[0].total,
            sosActivos: sosActivos[0].total,
            usuariosRegistrados: usuarios[0].total,
            rutasRiesgo: rutas[0].total
        };
    }
}

export default new DashboardRepository();

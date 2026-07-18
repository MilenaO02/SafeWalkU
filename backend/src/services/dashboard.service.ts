import pool from "../config/database";

class DashboardService {
    async getMetrics() {
        const [reportes]: any = await pool.query(`SELECT COUNT(*) as total FROM reporte`);
        const [sosActivos]: any = await pool.query(`SELECT COUNT(*) as total FROM reporte WHERE tipo_reporte='SOS_PANICO' AND estado='PENDIENTE'`);
        const [usuarios]: any = await pool.query(`SELECT COUNT(*) as total FROM usuario`);
        const [rutas]: any = await pool.query(`SELECT COUNT(*) as total FROM ruta`);

        return {
            totalReportes: reportes[0].total,
            sosActivos: sosActivos[0].total,
            usuariosRegistrados: usuarios[0].total,
            rutasRiesgo: rutas[0].total
        };
    }
}

export default new DashboardService();

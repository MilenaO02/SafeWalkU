import pool from "../config/database.js";
class DashboardRepository {
    async getMetrics() {
        const [reportes] = await pool.query("SELECT COUNT(*) AS total FROM reporte WHERE estado_registro = 'ACTIVO'");
        const [sosActivos] = await pool.query("SELECT COUNT(*) AS total FROM reporte WHERE tipo_reporte = 'SOS_PANICO' AND estado = 'PENDIENTE' AND estado_registro = 'ACTIVO'");
        const [usuarios] = await pool.query("SELECT COUNT(*) AS total FROM usuario WHERE estado = 'ACTIVO'");
        const [rutas] = await pool.query("SELECT COUNT(*) AS total FROM ruta");
        return {
            totalReportes: reportes[0].total,
            sosActivos: sosActivos[0].total,
            usuariosRegistrados: usuarios[0].total,
            rutasRiesgo: rutas[0].total
        };
    }
}
export default new DashboardRepository();

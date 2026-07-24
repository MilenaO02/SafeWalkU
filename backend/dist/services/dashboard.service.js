import dashboardRepository from "../repositories/dashboard.repository.js";
class DashboardService {
    async getMetrics() {
        return dashboardRepository.getMetrics();
    }
}
export default new DashboardService();

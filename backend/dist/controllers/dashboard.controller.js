import dashboardService from "../services/dashboard.service.js";
class DashboardController {
    async getMetrics(req, res) {
        try {
            const metrics = await dashboardService.getMetrics();
            res.json({ success: true, data: metrics });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
export default new DashboardController();

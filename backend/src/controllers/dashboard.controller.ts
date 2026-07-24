import { Request, Response } from "express";
import dashboardService from "../services/dashboard.service.js";

class DashboardController {
    async getMetrics(req: Request, res: Response) {
        try {
            const metrics = await dashboardService.getMetrics();
            res.json({ success: true, data: metrics });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

export default new DashboardController();

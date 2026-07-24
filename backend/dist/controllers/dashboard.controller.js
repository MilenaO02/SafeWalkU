"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dashboard_service_1 = __importDefault(require("../services/dashboard.service"));
class DashboardController {
    async getMetrics(req, res) {
        try {
            const metrics = await dashboard_service_1.default.getMetrics();
            res.json({ success: true, data: metrics });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.default = new DashboardController();

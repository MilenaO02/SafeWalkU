"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const report_repository_1 = __importDefault(require("../repositories/report.repository"));
class ReportService {
    async findAll() {
        return await report_repository_1.default.findAll();
    }
    async findById(id) {
        const reporte = await report_repository_1.default.findById(id);
        if (!reporte) {
            throw new Error("Reporte no encontrado");
        }
        return reporte;
    }
    async create(data) {
        return await report_repository_1.default.create(data);
    }
    async update(id, data) {
        const reporte = await report_repository_1.default.findById(id);
        if (!reporte) {
            throw new Error("Reporte no encontrado");
        }
        await report_repository_1.default.update(id, data);
        return await report_repository_1.default.findById(id);
    }
    async delete(id) {
        const reporte = await report_repository_1.default.findById(id);
        if (!reporte) {
            throw new Error("Reporte no encontrado");
        }
        await report_repository_1.default.delete(id);
        return {
            message: "Reporte eliminado correctamente"
        };
    }
    async findRiskZonesByCity(ciudad) {
        return await report_repository_1.default.findRiskZonesByCity(ciudad);
    }
    async createSOS(data) {
        return await report_repository_1.default.createSOS(data);
    }
    async cancelSOS(id) {
        const reporte = await report_repository_1.default.findById(id);
        if (!reporte)
            throw new Error("Reporte no encontrado");
        await report_repository_1.default.cancelSOS(id);
        return { message: "Alarma SOS cancelada" };
    }
}
exports.default = new ReportService();

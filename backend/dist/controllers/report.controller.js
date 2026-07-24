"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const report_service_1 = __importDefault(require("../services/report.service"));
class ReportController {
    async getAll(req, res) {
        try {
            const reports = await report_service_1.default.findAll();
            return res.status(200).json({
                success: true,
                data: reports
            });
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    async getById(req, res) {
        try {
            const id = Number(req.params.id);
            const report = await report_service_1.default.findById(id);
            return res.status(200).json({
                success: true,
                data: report
            });
        }
        catch (error) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
    }
    async create(req, res) {
        try {
            // Asegurar que el id del usuario provenga del token y no del body
            const user = req.user;
            const payload = {
                ...req.body,
                id_usuario: user?.id_usuario
            };
            const report = await report_service_1.default.create(payload);
            return res.status(201).json({
                success: true,
                message: "Reporte creado correctamente.",
                data: report
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
    async update(req, res) {
        try {
            const id = Number(req.params.id);
            const report = await report_service_1.default.update(id, req.body);
            return res.status(200).json({
                success: true,
                message: "Reporte actualizado correctamente.",
                data: report
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
    async delete(req, res) {
        try {
            const id = Number(req.params.id);
            const result = await report_service_1.default.delete(id);
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
    }
    async getRiskZones(req, res) {
        try {
            const ciudad = req.query.ciudad || 'Loja';
            const zones = await report_service_1.default.findRiskZonesByCity(ciudad);
            return res.status(200).json({ success: true, data: zones });
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    async createSOS(req, res) {
        try {
            const user = req.user;
            const payload = {
                ...req.body,
                id_usuario: user?.id_usuario
            };
            const report = await report_service_1.default.createSOS(payload);
            return res.status(201).json({ success: true, message: "SOS Activado", data: report });
        }
        catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
    }
    async cancelSOS(req, res) {
        try {
            const id = Number(req.params.id);
            const result = await report_service_1.default.cancelSOS(id);
            return res.status(200).json({ success: true, ...result });
        }
        catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
    }
}
exports.default = new ReportController();

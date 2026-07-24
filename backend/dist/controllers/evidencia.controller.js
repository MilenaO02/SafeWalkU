"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const evidencia_service_1 = __importDefault(require("../services/evidencia.service"));
class EvidenceController {
    async getAll(req, res) {
        try {
            const evidencias = await evidencia_service_1.default.findAll();
            return res.status(200).json({
                success: true,
                data: evidencias
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
            const evidencia = await evidencia_service_1.default.findById(id);
            return res.status(200).json({
                success: true,
                data: evidencia
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
            const evidencia = await evidencia_service_1.default.create(req.body);
            return res.status(201).json({
                success: true,
                message: "Evidencia creada correctamente.",
                data: evidencia
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
            const evidencia = await evidencia_service_1.default.update(id, req.body);
            return res.status(200).json({
                success: true,
                message: "Evidencia actualizada correctamente.",
                data: evidencia
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
            const result = await evidencia_service_1.default.delete(id);
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
    }
}
exports.default = new EvidenceController();

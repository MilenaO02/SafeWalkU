"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const evidencia_repository_1 = __importDefault(require("../repositories/evidencia.repository"));
class EvidenceService {
    async findAll() {
        return await evidencia_repository_1.default.findAll();
    }
    async findById(id) {
        const evidence = await evidencia_repository_1.default.findById(id);
        if (!evidence) {
            throw new Error("Evidencia no encontrada");
        }
        return evidence;
    }
    async create(data) {
        return await evidencia_repository_1.default.create(data);
    }
    async update(id, data) {
        const evidence = await evidencia_repository_1.default.findById(id);
        if (!evidence) {
            throw new Error("Evidencia no encontrada");
        }
        await evidencia_repository_1.default.update(id, data);
        return await evidencia_repository_1.default.findById(id);
    }
    async delete(id) {
        const evidence = await evidencia_repository_1.default.findById(id);
        if (!evidence) {
            throw new Error("Evidencia no encontrada");
        }
        await evidencia_repository_1.default.delete(id);
        return {
            success: true,
            message: "Evidencia eliminada correctamente"
        };
    }
}
exports.default = new EvidenceService();

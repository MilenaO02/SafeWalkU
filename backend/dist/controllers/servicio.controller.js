"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const servicio_repository_1 = __importDefault(require("../repositories/servicio.repository"));
class ServicioController {
    async getAll(req, res) {
        try {
            const servicios = await servicio_repository_1.default.findAll();
            res.json({ success: true, data: servicios });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message || "Error al obtener servicios de emergencia" });
        }
    }
}
exports.default = new ServicioController();

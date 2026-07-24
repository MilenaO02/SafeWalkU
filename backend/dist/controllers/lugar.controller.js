"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lugar_repository_1 = __importDefault(require("../repositories/lugar.repository"));
class LugarController {
    async getAll(req, res) {
        try {
            const lugares = await lugar_repository_1.default.findAll();
            res.json({ success: true, data: lugares });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message || "Error al obtener lugares seguros" });
        }
    }
}
exports.default = new LugarController();

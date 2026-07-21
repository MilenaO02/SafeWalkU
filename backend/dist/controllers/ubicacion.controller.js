"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ubicacion_service_1 = __importDefault(require("../services/ubicacion.service"));
class UbicacionController {
    async search(req, res) {
        try {
            const query = req.query.q;
            const ubicaciones = await ubicacion_service_1.default.searchUbicaciones(query);
            res.json(ubicaciones);
        }
        catch (error) {
            res.status(500).json({ error: "Error al buscar ubicaciones" });
        }
    }
}
exports.default = new UbicacionController();

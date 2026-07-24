"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ubicacion_repository_1 = __importDefault(require("../repositories/ubicacion.repository"));
class UbicacionService {
    async searchUbicaciones(query) {
        if (!query || query.length < 3) {
            return [];
        }
        return await ubicacion_repository_1.default.findByQuery(query);
    }
}
exports.default = new UbicacionService();

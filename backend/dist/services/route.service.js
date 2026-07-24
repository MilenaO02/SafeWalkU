"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const route_repository_1 = __importDefault(require("../repositories/route.repository"));
class RouteService {
    async findAll() {
        return await route_repository_1.default.findAll();
    }
    async findById(id) {
        const route = await route_repository_1.default.findById(id);
        if (!route) {
            throw new Error("Ruta no encontrada");
        }
        return route;
    }
    async create(data) {
        return await route_repository_1.default.create(data);
    }
    async update(id, data) {
        const route = await route_repository_1.default.findById(id);
        if (!route) {
            throw new Error("Ruta no encontrada");
        }
        await route_repository_1.default.update(id, data);
        return await route_repository_1.default.findById(id);
    }
    async delete(id) {
        const route = await route_repository_1.default.findById(id);
        if (!route) {
            throw new Error("Ruta no encontrada");
        }
        await route_repository_1.default.delete(id);
        return {
            success: true,
            message: "Ruta eliminada correctamente"
        };
    }
    async trazarRuta(origen_lat, origen_lng, destino_id) {
        return await route_repository_1.default.trazarRuta(origen_lat, origen_lng, destino_id);
    }
}
exports.default = new RouteService();

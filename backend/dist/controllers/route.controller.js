"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const route_service_1 = __importDefault(require("../services/route.service"));
class RouteController {
    async getAll(req, res) {
        try {
            const routes = await route_service_1.default.findAll();
            return res.status(200).json({
                success: true,
                data: routes
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
            const route = await route_service_1.default.findById(id);
            return res.status(200).json({
                success: true,
                data: route
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
            const id = await route_service_1.default.create(req.body);
            return res.status(201).json({
                success: true,
                message: "Ruta creada correctamente",
                id
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
            const route = await route_service_1.default.update(id, req.body);
            return res.status(200).json({
                success: true,
                message: "Ruta actualizada correctamente",
                data: route
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
            const result = await route_service_1.default.delete(id);
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
    }
    async trazarRuta(req, res) {
        try {
            const origen_lat = Number(req.query.origen_lat);
            const origen_lng = Number(req.query.origen_lng);
            const destino_id = Number(req.query.destino_id);
            if (!origen_lat || !origen_lng || !destino_id) {
                return res.status(400).json({ success: false, message: "Faltan parámetros de origen o destino" });
            }
            const result = await route_service_1.default.trazarRuta(origen_lat, origen_lng, destino_id);
            return res.status(200).json({ success: true, data: result });
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.default = new RouteController();

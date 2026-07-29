import routeService from "../services/route.service.js";
import { traceRouteQuerySchema } from "../schemas/route.schema.js";
class RouteController {
    async getAll(req, res) {
        try {
            const routes = await routeService.findAll();
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
            const route = await routeService.findById(id);
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
            const route = await routeService.create(req.body);
            return res.status(201).json({
                success: true,
                message: "Ruta creada correctamente",
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
    async update(req, res) {
        try {
            const id = Number(req.params.id);
            const route = await routeService.update(id, req.body);
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
            const result = await routeService.delete(id);
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
            const parsed = traceRouteQuerySchema.safeParse(req.query);
            if (!parsed.success) {
                return res.status(422).json({
                    success: false,
                    message: "Parámetros geográficos inválidos",
                    errors: parsed.error.issues
                });
            }
            const destination = parsed.data.destino_id !== undefined
                ? { mode: "REGISTERED", id: parsed.data.destino_id }
                : { mode: "EXTERNAL", lat: parsed.data.destino_lat, lng: parsed.data.destino_lng, nombre: parsed.data.destino_nombre, direccion: parsed.data.destino_direccion, placeId: parsed.data.place_id };
            const result = await routeService.trazarRuta(parsed.data.origen_lat, parsed.data.origen_lng, destination);
            return res.status(200).json({ success: true, data: result });
        }
        catch (error) {
            const status = error.message === "Destino no encontrado"
                ? 404
                : error.message?.includes("no está configurado")
                    ? 503
                    : error.message?.includes("Google Routes")
                        ? 502
                        : 500;
            return res.status(status).json({ success: false, message: error.message });
        }
    }
}
export default new RouteController();

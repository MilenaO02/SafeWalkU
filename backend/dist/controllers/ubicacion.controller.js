import ubicacionService from "../services/ubicacion.service.js";
class UbicacionController {
    async getAll(_req, res) {
        try {
            return res.json({ success: true, data: await ubicacionService.getAll() });
        }
        catch {
            return res.status(500).json({ success: false, message: "Error al obtener ubicaciones" });
        }
    }
    async search(req, res) {
        try {
            const query = req.query.q;
            const ubicaciones = await ubicacionService.searchUbicaciones(query);
            return res.json({ success: true, data: ubicaciones });
        }
        catch (error) {
            return res.status(500).json({ success: false, message: "Error al buscar ubicaciones" });
        }
    }
    async updateCoordinates(req, res) {
        try {
            const location = await ubicacionService.updateCoordinates(Number(req.params.id), req.body, req.user.id_usuario);
            return res.json({ success: true, message: "Ubicacion actualizada", data: location });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Error al actualizar ubicacion";
            return res.status(message === "Ubicacion no encontrada" ? 404 : 400).json({ success: false, message });
        }
    }
    async create(req, res) {
        try {
            const location = await ubicacionService.create(req.body);
            return res.status(201).json({ success: true, message: "Ubicacion creada", data: location });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Error al crear ubicacion";
            return res.status(400).json({ success: false, message });
        }
    }
    async getDependencies(req, res) {
        try {
            await ubicacionService.getDeleteImpact(Number(req.params.id));
            return res.json({ success: true, data: { canDeactivate: true } });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Error al revisar relaciones";
            return res.status(message === "Ubicacion no encontrada" ? 404 : 400).json({ success: false, message });
        }
    }
    async remove(req, res) {
        try {
            await ubicacionService.remove(Number(req.params.id));
            return res.json({ success: true, message: "Ubicacion desactivada correctamente" });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Error al desactivar ubicacion";
            return res.status(message === "Ubicacion no encontrada" ? 404 : 400).json({ success: false, message });
        }
    }
}
export default new UbicacionController();

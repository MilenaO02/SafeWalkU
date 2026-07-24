import servicioService from "../services/servicio.service.js";
class ServicioController {
    async getAll(req, res) {
        try {
            const servicios = await servicioService.getAll();
            res.json({ success: true, data: servicios });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message || "Error al obtener servicios de emergencia" });
        }
    }
}
export default new ServicioController();

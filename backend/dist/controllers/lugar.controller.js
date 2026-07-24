import lugarService from "../services/lugar.service.js";
class LugarController {
    async getAll(req, res) {
        try {
            const lugares = await lugarService.getAll();
            res.json({ success: true, data: lugares });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message || "Error al obtener lugares seguros" });
        }
    }
}
export default new LugarController();

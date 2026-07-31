import reportService, { ActiveSOSConflictError } from "../services/report.service.js";
class ReportController {
    async getAll(req, res) {
        try {
            const requestedFilter = String(req.query.registro ?? "ACTIVOS").toUpperCase();
            if (!["ACTIVOS", "ARCHIVADOS", "TODOS"].includes(requestedFilter)) {
                return res.status(400).json({ success: false, message: "El filtro registro debe ser ACTIVOS, ARCHIVADOS o TODOS" });
            }
            const reports = await reportService.findAll(req.user, requestedFilter);
            return res.status(200).json({
                success: true,
                data: reports
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
            const report = await reportService.findAccessibleById(id, req.user);
            return res.status(200).json({
                success: true,
                data: report
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
            const report = await reportService.create(req.body, req.user.id_usuario);
            return res.status(201).json({
                success: true,
                message: "Reporte creado correctamente.",
                data: report
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
            const report = await reportService.update(id, req.body, req.user.id_usuario);
            return res.status(200).json({
                success: true,
                message: "Reporte actualizado correctamente.",
                data: report
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
            const result = await reportService.delete(id);
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
    }
    async getRiskZones(req, res) {
        try {
            const ciudad = req.query.ciudad || 'Loja';
            const zones = await reportService.findRiskZonesByCity(ciudad);
            return res.status(200).json({ success: true, data: zones });
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    async createSOS(req, res) {
        try {
            const report = await reportService.createSOS(req.body, req.user.id_usuario);
            return res.status(201).json({ success: true, message: "SOS Activado", data: report });
        }
        catch (error) {
            const status = error instanceof ActiveSOSConflictError ? 409 : 400;
            return res.status(status).json({ success: false, message: error.message });
        }
    }
    async restore(req, res) {
        try {
            const id = Number(req.params.id);
            const result = await reportService.restore(id);
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(404).json({ success: false, message: error.message });
        }
    }
    async cancelSOS(req, res) {
        try {
            const id = Number(req.params.id);
            const result = await reportService.cancelSOS(id, req.user);
            return res.status(200).json({ success: true, ...result });
        }
        catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
    }
    async resolveSOS(req, res) {
        try {
            const result = await reportService.resolveSOS(Number(req.params.id), req.user.id_usuario);
            return res.status(200).json({ success: true, ...result });
        }
        catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
    }
}
export default new ReportController();

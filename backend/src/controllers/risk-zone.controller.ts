import { Request, Response } from 'express';
import riskZoneService from '../services/risk-zone.service.js';

function errorMessage(error: unknown) { return error instanceof Error ? error.message : 'No fue posible completar la solicitud.'; }
class RiskZoneController {
    async list(req: Request, res: Response) { try { return res.json({ success: true, data: await riskZoneService.list(req.query.active === 'true') }); } catch (error) { return res.status(500).json({ success: false, message: errorMessage(error) }); } }
    async get(req: Request, res: Response) { const data = await riskZoneService.get(Number(req.params.id)); return data ? res.json({ success: true, data }) : res.status(404).json({ success: false, message: 'Zona de riesgo no encontrada.' }); }
    async create(req: Request, res: Response) { try { return res.status(201).json({ success: true, data: await riskZoneService.create(req.body, req.user!.id_usuario) }); } catch (error) { return res.status(400).json({ success: false, message: errorMessage(error) }); } }
    async update(req: Request, res: Response) { try { return res.json({ success: true, data: await riskZoneService.update(Number(req.params.id), req.body) }); } catch (error) { return res.status(404).json({ success: false, message: errorMessage(error) }); } }
    async remove(req: Request, res: Response) { try { await riskZoneService.remove(Number(req.params.id)); return res.json({ success: true, message: 'Zona de riesgo eliminada.' }); } catch (error) { return res.status(404).json({ success: false, message: errorMessage(error) }); } }
    async dynamic(_req: Request, res: Response) { try { return res.json({ success: true, data: await riskZoneService.dynamic(), persisted: false }); } catch (error) { return res.status(500).json({ success: false, message: errorMessage(error) }); } }
    async statistics(_req: Request, res: Response) { try { return res.json({ success: true, data: await riskZoneService.statistics() }); } catch (error) { return res.status(500).json({ success: false, message: errorMessage(error) }); } }
    async heatmap(_req: Request, res: Response) { try { return res.json({ success: true, data: await riskZoneService.heatmapPoints() }); } catch (error) { return res.status(500).json({ success: false, message: errorMessage(error) }); } }
    async approve(req: Request, res: Response) {
        try {
            return res.status(201).json({ success: true, data: await riskZoneService.approveDynamic(req.body.candidate_key, req.body, req.user!.id_usuario) });
        } catch (error) {
            console.error('No se pudo aprobar la zona dinámica:', error instanceof Error ? error.message : error);
            return res.status(500).json({ success: false, message: 'No fue posible aprobar la zona de riesgo. Inténtalo nuevamente.' });
        }
    }
}
export default new RiskZoneController();

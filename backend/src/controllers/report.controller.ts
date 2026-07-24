import { Request, Response } from "express";
import reportService from "../services/report.service.js";

class ReportController {

    async getAll(req: Request, res: Response) {

        try {

            const reports = await reportService.findAll(req.user!);

            return res.status(200).json({

                success: true,

                data: reports

            });

        } catch (error: any) {

            return res.status(500).json({

                success: false,

                message: error.message

            });

        }

    }

    async getById(req: Request, res: Response) {

        try {

            const id = Number(req.params.id);

            const report = await reportService.findAccessibleById(id, req.user!);

            return res.status(200).json({

                success: true,

                data: report

            });

        } catch (error: any) {

            return res.status(404).json({

                success: false,

                message: error.message

            });

        }

    }

    async create(req: Request, res: Response) {

        try {

            const report = await reportService.create(req.body, req.user!.id_usuario);

            return res.status(201).json({
                success: true,
                message: "Reporte creado correctamente.",
                data: report
            });

        } catch (error: any) {

            return res.status(400).json({

                success: false,

                message: error.message

            });

        }

    }

    async update(req: Request, res: Response) {

        try {

            const id = Number(req.params.id);

            const report = await reportService.update(id, req.body, req.user!.id_usuario);

            return res.status(200).json({

                success: true,

                message: "Reporte actualizado correctamente.",

                data: report

            });

        } catch (error: any) {

            return res.status(400).json({

                success: false,

                message: error.message

            });

        }

    }

    async delete(req: Request, res: Response) {

        try {

            const id = Number(req.params.id);

            const result = await reportService.delete(id);

            return res.status(200).json(result);

        } catch (error: any) {

            return res.status(404).json({

                success: false,

                message: error.message

            });

        }

    }

    async getRiskZones(req: Request, res: Response) {
        try {
            const ciudad = (req.query.ciudad as string) || 'Loja';
            const zones = await reportService.findRiskZonesByCity(ciudad);
            return res.status(200).json({ success: true, data: zones });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async createSOS(req: Request, res: Response) {
        try {
            const report = await reportService.createSOS(req.body, req.user!.id_usuario);
            return res.status(201).json({ success: true, message: "SOS Activado", data: report });
        } catch (error: any) {
            return res.status(400).json({ success: false, message: error.message });
        }
    }

    async cancelSOS(req: Request, res: Response) {
        try {
            const id = Number(req.params.id);
            const result = await reportService.cancelSOS(id, req.user!);
            return res.status(200).json({ success: true, ...result });
        } catch (error: any) {
            return res.status(400).json({ success: false, message: error.message });
        }
    }

    async resolveSOS(req: Request, res: Response) {
        try {
            const result = await reportService.resolveSOS(Number(req.params.id), req.user!.id_usuario);
            return res.status(200).json({ success: true, ...result });
        } catch (error: any) {
            return res.status(400).json({ success: false, message: error.message });
        }
    }

}

export default new ReportController();

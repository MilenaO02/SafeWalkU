import { Request, Response } from "express";
import reportService from "../services/report.service";

class ReportController {

    async getAll(req: Request, res: Response) {

        try {

            const reports = await reportService.findAll();

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

            const report = await reportService.findById(id);

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

            const report = await reportService.create(req.body);

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

            const report = await reportService.update(id, req.body);

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

}

export default new ReportController();
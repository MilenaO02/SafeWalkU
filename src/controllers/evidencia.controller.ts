import { Request, Response } from "express";
import evidenceService from "../services/evidencia.service";

class EvidenceController {

    async getAll(req: Request, res: Response) {

        try {

            const evidencias = await evidenceService.findAll();

            return res.status(200).json({

                success: true,

                data: evidencias

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

            const evidencia = await evidenceService.findById(id);

            return res.status(200).json({

                success: true,

                data: evidencia

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

            const evidencia = await evidenceService.create(req.body);

            return res.status(201).json({

                success: true,

                message: "Evidencia creada correctamente.",

                data: evidencia

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

            const evidencia = await evidenceService.update(id, req.body);

            return res.status(200).json({

                success: true,

                message: "Evidencia actualizada correctamente.",

                data: evidencia

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

            const result = await evidenceService.delete(id);

            return res.status(200).json(result);

        } catch (error: any) {

            return res.status(404).json({

                success: false,

                message: error.message

            });

        }

    }

}

export default new EvidenceController();
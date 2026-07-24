import fs from "fs";
import evidenceService from "../services/evidencia.service.js";
import { evidenceUploadSchema } from "../schemas/evidencia.schema.js";
import { hasValidEvidenceSignature } from "../config/evidenceUpload.js";
async function discard(file) {
    if (file)
        await fs.promises.unlink(file.path).catch(() => undefined);
}
class EvidenceController {
    async getAll(_req, res) {
        try {
            return res.status(200).json({ success: true, data: await evidenceService.findAll() });
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    async getById(req, res) {
        try {
            const evidence = await evidenceService.findById(Number(req.params.id), req.user);
            return res.status(200).json({ success: true, data: evidence });
        }
        catch (error) {
            const status = error.message.includes("No puede") ? 403 : 404;
            return res.status(status).json({ success: false, message: error.message });
        }
    }
    async create(req, res) {
        try {
            if (!req.file)
                return res.status(400).json({ success: false, message: "Debe adjuntar un archivo" });
            const parsed = evidenceUploadSchema.safeParse(req.body);
            if (!parsed.success) {
                await discard(req.file);
                return res.status(422).json({ success: false, message: "ID de reporte inválido", errors: parsed.error.issues });
            }
            if (!await hasValidEvidenceSignature(req.file.path, req.file.mimetype)) {
                await discard(req.file);
                return res.status(400).json({ success: false, message: "El contenido no corresponde a un archivo multimedia válido" });
            }
            const evidence = await evidenceService.create(parsed.data.id_reporte, req.file, req.user);
            return res.status(201).json({ success: true, message: "Evidencia cargada correctamente", data: evidence });
        }
        catch (error) {
            await discard(req.file);
            const status = error.message.includes("ajeno") ? 403 : 400;
            return res.status(status).json({ success: false, message: error.message });
        }
    }
    async update(req, res) {
        try {
            if (!req.file)
                return res.status(400).json({ success: false, message: "Debe adjuntar un archivo" });
            if (!await hasValidEvidenceSignature(req.file.path, req.file.mimetype)) {
                await discard(req.file);
                return res.status(400).json({ success: false, message: "El contenido no corresponde a un archivo multimedia válido" });
            }
            const evidence = await evidenceService.replace(Number(req.params.id), req.file, req.user);
            return res.status(200).json({ success: true, message: "Evidencia reemplazada correctamente", data: evidence });
        }
        catch (error) {
            await discard(req.file);
            const status = error.message.includes("No puede") ? 403 : 400;
            return res.status(status).json({ success: false, message: error.message });
        }
    }
    async delete(req, res) {
        try {
            return res.status(200).json(await evidenceService.delete(Number(req.params.id), req.user));
        }
        catch (error) {
            const status = error.message.includes("No puede") ? 403 : 404;
            return res.status(status).json({ success: false, message: error.message });
        }
    }
}
export default new EvidenceController();

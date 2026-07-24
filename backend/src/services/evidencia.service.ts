import fs from "fs";
import path from "path";
import evidenceRepository, { EvidenceRow } from "../repositories/evidencia.repository.js";
import reportRepository from "../repositories/report.repository.js";
import { evidenceTypeFromMime, evidenceUploadsDir } from "../config/evidenceUpload.js";

type SessionUser = { id_usuario: number; rol: string };

function canManage(evidence: EvidenceRow, user: SessionUser) {
    return user.rol === "ADMINISTRADOR"
        || (evidence.id_usuario === user.id_usuario && evidence.estado_reporte === "PENDIENTE");
}

async function removeLocalFile(url: string) {
    if (!url.startsWith("/uploads/evidencias/")) return;
    const filePath = path.join(evidenceUploadsDir, path.basename(url));
    await fs.promises.unlink(filePath).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== "ENOENT") console.error("No se pudo eliminar el archivo de evidencia:", error.message);
    });
}

class EvidenceService {
    findAll() {
        return evidenceRepository.findAll();
    }

    async findById(id: number, user: SessionUser) {
        if (!Number.isInteger(id) || id < 1) throw new Error("ID de evidencia inválido");
        const evidence = await evidenceRepository.findById(id);
        if (!evidence) throw new Error("Evidencia no encontrada");
        if (user.rol !== "ADMINISTRADOR" && evidence.id_usuario !== user.id_usuario) {
            throw new Error("No puede consultar evidencias de otro usuario");
        }
        return evidence;
    }

    async create(reportId: number, file: Express.Multer.File, user: SessionUser) {
        const report = await reportRepository.findById(reportId);
        if (!report) throw new Error("Reporte no encontrado");
        if (user.rol !== "ADMINISTRADOR" && report.id_usuario !== user.id_usuario) {
            throw new Error("No puede adjuntar evidencia a un reporte ajeno");
        }
        if (user.rol !== "ADMINISTRADOR" && report.estado !== "PENDIENTE") {
            throw new Error("Solo puede adjuntar evidencia mientras el reporte está pendiente");
        }
        if (await evidenceRepository.countByReport(reportId) >= 5) {
            throw new Error("Un reporte admite un máximo de 5 evidencias");
        }

        const url = `/uploads/evidencias/${file.filename}`;
        const id = await evidenceRepository.create({
            url_archivo: url,
            tipo_archivo: evidenceTypeFromMime(file.mimetype),
            id_reporte: reportId
        });
        return evidenceRepository.findById(id);
    }

    async replace(id: number, file: Express.Multer.File, user: SessionUser) {
        const current = await evidenceRepository.findById(id);
        if (!current) throw new Error("Evidencia no encontrada");
        if (!canManage(current, user)) throw new Error("No puede modificar esta evidencia");

        const newUrl = `/uploads/evidencias/${file.filename}`;
        await evidenceRepository.updateFile(id, newUrl, evidenceTypeFromMime(file.mimetype));
        await removeLocalFile(current.url_archivo);
        return evidenceRepository.findById(id);
    }

    async delete(id: number, user: SessionUser) {
        const evidence = await evidenceRepository.findById(id);
        if (!evidence) throw new Error("Evidencia no encontrada");
        if (!canManage(evidence, user)) throw new Error("No puede eliminar esta evidencia");
        await evidenceRepository.delete(id);
        await removeLocalFile(evidence.url_archivo);
        return { success: true, message: "Evidencia eliminada correctamente" };
    }
}

export default new EvidenceService();

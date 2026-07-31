import reportRepository, { ReportRegistryFilter, ReportRow } from "../repositories/report.repository.js";
import evidenceRepository from "../repositories/evidencia.repository.js";

type SessionUser = { id_usuario: number; rol: string };

export class ActiveSOSConflictError extends Error {
    constructor() {
        super("Ya existe una alerta SOS pendiente para este usuario");
        this.name = "ActiveSOSConflictError";
    }
}

class ReportService {
    async findAll(user: SessionUser, registryFilter: ReportRegistryFilter = "ACTIVOS") {
        const effectiveFilter = user.rol === "ADMINISTRADOR" ? registryFilter : "ACTIVOS";
        const reports = await reportRepository.findAll(user.rol === "ADMINISTRADOR" ? undefined : user.id_usuario, effectiveFilter);
        const evidence = await evidenceRepository.findByReportIds(
            reports.map((report) => report.id_reporte),
            user.rol === "ADMINISTRADOR" && effectiveFilter !== "ACTIVOS"
        );
        const evidenceByReport = new Map<number, typeof evidence>();

        for (const item of evidence) {
            const reportEvidence = evidenceByReport.get(item.id_reporte) ?? [];
            reportEvidence.push(item);
            evidenceByReport.set(item.id_reporte, reportEvidence);
        }

        return reports.map((report) => ({
            ...report,
            evidencias: evidenceByReport.get(report.id_reporte) ?? []
        }));
    }

    async findById(id: number) {
        if (!Number.isInteger(id) || id < 1) throw new Error("ID de reporte inválido");
        const reporte = await reportRepository.findById(id);
        if (!reporte) throw new Error("Reporte no encontrado");
        const evidencias = await evidenceRepository.findByReportIds([id]);
        return { ...reporte, evidencias };
    }

    async findAccessibleById(id: number, user: SessionUser) {
        const report = await this.findById(id);
        if (user.rol !== "ADMINISTRADOR" && report.id_usuario !== user.id_usuario) {
            throw new Error("No puede consultar un reporte ajeno");
        }
        return report;
    }

    async create(data: {
        descripcion: string;
        nivel_riesgo: "BAJO" | "MEDIO" | "ALTO";
        latitud: number;
        longitud: number;
        precision_gps: number;
        fecha_captura_gps: string;
        direccion_aproximada?: string;
    }, userId: number) {
        const id = await reportRepository.create({ ...data, id_usuario: userId });
        return this.findById(id);
    }

    async update(id: number, data: Partial<ReportRow>, adminUserId: number) {
        const reporte = await this.findById(id);
        if (reporte.tipo_reporte !== "INCIDENTE") {
            throw new Error("Las alertas SOS se gestionan mediante su operación específica");
        }
        const adminId = await reportRepository.findAdministratorId(adminUserId);
        if (!adminId) throw new Error("El usuario no posee un perfil de administrador válido");
        await reportRepository.update(id, data, adminId);
        return this.findById(id);
    }

    async delete(id: number) {
        await this.findById(id);
        const affected = await reportRepository.delete(id);
        if (affected !== 1) throw new Error("No fue posible archivar el reporte");
        return { success: true, message: "Reporte archivado correctamente" };
    }

    async restore(id: number) {
        if (!Number.isInteger(id) || id < 1) throw new Error("ID de reporte invÃ¡lido");
        const report = await reportRepository.findByIdIncludingArchived(id);
        if (!report) throw new Error("Reporte no encontrado");
        if (report.estado_registro === "ACTIVO") throw new Error("El reporte ya se encuentra activo");
        const affected = await reportRepository.restore(id);
        if (affected !== 1) throw new Error("No fue posible restaurar el reporte");
        return { success: true, message: "Reporte restaurado correctamente" };
    }

    findRiskZonesByCity(ciudad: string) {
        const normalizedCity = ciudad.trim().slice(0, 100) || "Loja";
        return reportRepository.findRiskZonesByCity(normalizedCity);
    }

    async createSOS(data: {
        descripcion: string;
        latitud: number;
        longitud: number;
        precision_gps: number;
        fecha_captura_gps: string;
        direccion_aproximada?: string;
    }, userId: number) {
        if (await reportRepository.findActiveSOSByUser(userId)) {
            throw new ActiveSOSConflictError();
        }
        const id = await reportRepository.createSOS({ ...data, id_usuario: userId });
        return this.findById(id);
    }

    async cancelSOS(id: number, user: SessionUser) {
        const reporte = await this.findById(id);
        if (reporte.tipo_reporte !== "SOS_PANICO") throw new Error("El reporte indicado no es una alerta SOS");
        if (reporte.estado !== "PENDIENTE") throw new Error("La alerta SOS ya no está activa");
        if (user.rol !== "ADMINISTRADOR" && reporte.id_usuario !== user.id_usuario) {
            throw new Error("No puede cancelar la alerta SOS de otro usuario");
        }
        const affected = await reportRepository.cancelSOS(id);
        if (affected !== 1) throw new Error("No fue posible cancelar la alerta SOS");
        return { message: "Alarma SOS cancelada" };
    }

    async resolveSOS(id: number, adminUserId: number) {
        const reporte = await this.findById(id);
        if (reporte.tipo_reporte !== "SOS_PANICO") throw new Error("El reporte indicado no es una alerta SOS");
        if (reporte.estado !== "PENDIENTE") throw new Error("La alerta SOS ya no está activa");
        const adminId = await reportRepository.findAdministratorId(adminUserId);
        if (!adminId) throw new Error("El usuario no posee un perfil de administrador válido");
        const affected = await reportRepository.resolveSOS(id, adminId);
        if (affected !== 1) throw new Error("No fue posible atender la alerta SOS");
        return { message: "Alerta SOS marcada como atendida" };
    }
}

export default new ReportService();

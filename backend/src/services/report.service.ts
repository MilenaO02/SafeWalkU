import reportRepository, { ReportRow } from "../repositories/report.repository.js";

type SessionUser = { id_usuario: number; rol: string };

class ReportService {
    findAll(user: SessionUser) {
        return reportRepository.findAll(user.rol === "ADMINISTRADOR" ? undefined : user.id_usuario);
    }

    async findById(id: number) {
        if (!Number.isInteger(id) || id < 1) throw new Error("ID de reporte inválido");
        const reporte = await reportRepository.findById(id);
        if (!reporte) throw new Error("Reporte no encontrado");
        return reporte;
    }

    async findAccessibleById(id: number, user: SessionUser) {
        const report = await this.findById(id);
        if (user.rol !== "ADMINISTRADOR" && report.id_usuario !== user.id_usuario) {
            throw new Error("No puede consultar un reporte ajeno");
        }
        return report;
    }

    async create(data: { descripcion: string; nivel_riesgo: "BAJO" | "MEDIO" | "ALTO"; id_ubicacion: number }, userId: number) {
        if (!await reportRepository.locationExists(data.id_ubicacion)) {
            throw new Error("La ubicación indicada no existe");
        }
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
        await reportRepository.delete(id);
        return { success: true, message: "Reporte desactivado correctamente" };
    }

    findRiskZonesByCity(ciudad: string) {
        const normalizedCity = ciudad.trim().slice(0, 100) || "Loja";
        return reportRepository.findRiskZonesByCity(normalizedCity);
    }

    async createSOS(data: { descripcion: string; id_ubicacion: number }, userId: number) {
        if (!await reportRepository.locationExists(data.id_ubicacion)) {
            throw new Error("La ubicación indicada no existe");
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

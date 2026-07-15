import reportRepository from "../repositories/report.repository";

class ReportService {

    async findAll() {

        return await reportRepository.findAll();

    }

    async findById(id: number) {

        const reporte = await reportRepository.findById(id);

        if (!reporte) {

            throw new Error("Reporte no encontrado");

        }

        return reporte;

    }

    async create(data: any) {

        return await reportRepository.create(data);

    }

    async update(id: number, data: any) {

        const reporte = await reportRepository.findById(id);

        if (!reporte) {

            throw new Error("Reporte no encontrado");

        }

        await reportRepository.update(id, data);

        return await reportRepository.findById(id);

    }

    async delete(id: number) {

        const reporte = await reportRepository.findById(id);

        if (!reporte) {

            throw new Error("Reporte no encontrado");

        }

        await reportRepository.delete(id);

        return {

            message: "Reporte eliminado correctamente"

        };

    }

    async findRiskZonesByCity(ciudad: string) {
        return await reportRepository.findRiskZonesByCity(ciudad);
    }

    async createSOS(data: any) {
        return await reportRepository.createSOS(data);
    }

    async cancelSOS(id: number) {
        const reporte = await reportRepository.findById(id);
        if (!reporte) throw new Error("Reporte no encontrado");
        await reportRepository.cancelSOS(id);
        return { message: "Alarma SOS cancelada" };
    }

}

export default new ReportService();
import evidenceRepository from "../repositories/evidencia.repository";

class EvidenceService {

    async findAll() {

        return await evidenceRepository.findAll();

    }

    async findById(id: number) {

        const evidence = await evidenceRepository.findById(id);

        if (!evidence) {

            throw new Error("Evidencia no encontrada");

        }

        return evidence;

    }

    async create(data: any) {

        return await evidenceRepository.create(data);

    }

    async update(id: number, data: any) {

        const evidence = await evidenceRepository.findById(id);

        if (!evidence) {

            throw new Error("Evidencia no encontrada");

        }

        await evidenceRepository.update(id, data);

        return await evidenceRepository.findById(id);

    }

    async delete(id: number) {

        const evidence = await evidenceRepository.findById(id);

        if (!evidence) {

            throw new Error("Evidencia no encontrada");

        }

        await evidenceRepository.delete(id);

        return {

            success: true,

            message: "Evidencia eliminada correctamente"

        };

    }

}

export default new EvidenceService();
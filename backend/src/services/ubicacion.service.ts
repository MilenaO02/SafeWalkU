import ubicacionRepository from "../repositories/ubicacion.repository.js";

class UbicacionService {
    getAll() {
        return ubicacionRepository.findAll();
    }

    async searchUbicaciones(query: string) {
        const normalized = query?.toString().trim().slice(0, 100) ?? "";
        if (normalized.length < 2) {
            return [];
        }
        return ubicacionRepository.findByQuery(normalized);
    }

    async updateCoordinates(id: number, data: { nombre: string; direccion: string; latitud: number; longitud: number }, adminUserId: number) {
        if (!Number.isInteger(id) || id < 1) throw new Error("ID de ubicacion invalido");
        if (!Number.isInteger(adminUserId) || adminUserId < 1) throw new Error("Administrador inválido");
        await ubicacionRepository.updateCoordinates(id, data, adminUserId);
        return (await ubicacionRepository.findAll()).find((location) => location.id_ubicacion === id);
    }

    async create(data: { nombre: string; direccion: string; latitud: number; longitud: number; tipo: string; radio_metros?: number }) {
        const id = await ubicacionRepository.create(data);
        return (await ubicacionRepository.findAll()).find((location) => location.id_ubicacion === id);
    }

    async getDeleteImpact(id: number) {
        if (!Number.isInteger(id) || id < 1) throw new Error("ID de ubicacion invalido");
        return ubicacionRepository.getDeleteImpact(id);
    }

    async remove(id: number) {
        if (!Number.isInteger(id) || id < 1) throw new Error("ID de ubicacion invalido");
        const impact = await ubicacionRepository.deactivate(id);
        if (!impact) throw new Error("Ubicacion no encontrada");
        return impact;
    }
}

export default new UbicacionService();

import ubicacionRepository from "../repositories/ubicacion.repository.js";

class UbicacionService {
    getAll() {
        return ubicacionRepository.findAll();
    }

    async searchUbicaciones(query: string) {
        const normalized = query?.toString().trim().slice(0, 100) ?? "";
        if (normalized.length < 3) {
            return [];
        }
        return ubicacionRepository.findByQuery(normalized);
    }

    async updateCoordinates(id: number, data: { nombre: string; direccion: string; latitud: number; longitud: number }) {
        if (!Number.isInteger(id) || id < 1) throw new Error("ID de ubicacion invalido");
        await ubicacionRepository.updateCoordinates(id, data);
        return (await ubicacionRepository.findAll()).find((location) => location.id_ubicacion === id);
    }
}

export default new UbicacionService();

import ubicacionRepository from "../repositories/ubicacion.repository";

class UbicacionService {
    async searchUbicaciones(query: string) {
        if (!query || query.length < 3) {
            return [];
        }
        return await ubicacionRepository.findByQuery(query);
    }
}

export default new UbicacionService();

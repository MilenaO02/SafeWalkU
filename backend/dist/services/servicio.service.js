import servicioRepository from "../repositories/servicio.repository.js";
class ServicioService {
    getAll() {
        return servicioRepository.findAll();
    }
}
export default new ServicioService();

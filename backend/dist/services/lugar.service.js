import lugarRepository from "../repositories/lugar.repository.js";
class LugarService {
    getAll() {
        return lugarRepository.findAll();
    }
}
export default new LugarService();

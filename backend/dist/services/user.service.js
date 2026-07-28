import repository from "../repositories/user.repository.js";
class UserService {
    async getAll() {
        return repository.findAll();
    }
    async getById(id) {
        return repository.findById(id);
    }
    async getAvailableRoles(id) {
        return repository.findAvailableRoles(id);
    }
    async update(id, data) {
        if (data.correo) {
            const existing = await repository.findByEmail(data.correo);
            if (existing && existing.id_usuario !== id) {
                throw new Error("Correo ya registrado");
            }
        }
        return repository.update(id, data);
    }
    async delete(id) {
        return repository.delete(id);
    }
    async updateFotoPerfil(id, foto_perfil) {
        return repository.updateFotoPerfil(id, foto_perfil);
    }
}
export default new UserService();

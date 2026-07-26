import repository from "../repositories/user.repository.js";

class UserService {

    async getAll() {

        return await repository.findAll();

    }

    async getById(id: number) {

        return await repository.findById(id);

    }

    async getAvailableRoles(id: number) {

        return await repository.findAvailableRoles(id);

    }

    async update(id: number, data: any) {

        if (data.correo) {
            const existing = await repository.findByEmail(data.correo);
            if (existing && existing.id_usuario !== id) {
                throw new Error("Correo ya registrado");
            }
        }

        return await repository.update(id, data);

    }

    async delete(id: number) {

        return await repository.delete(id);

    }

    async updateFotoPerfil(id: number, foto_perfil: string) {

        return await repository.updateFotoPerfil(id, foto_perfil);

    }

}

export default new UserService();

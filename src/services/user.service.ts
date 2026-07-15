import repository from "../repositories/user.repository";

class UserService {

    async getAll() {

        return await repository.findAll();

    }

    async getById(id: number) {

        return await repository.findById(id);

    }

    async update(id: number, data: any) {

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
import routeRepository from "../repositories/route.repository";

class RouteService {

    async findAll() {

        return await routeRepository.findAll();

    }

    async findById(id: number) {

        const route = await routeRepository.findById(id);

        if (!route) {

            throw new Error("Ruta no encontrada");

        }

        return route;

    }

    async create(data: any) {

        return await routeRepository.create(data);

    }

    async update(id: number, data: any) {

        const route = await routeRepository.findById(id);

        if (!route) {

            throw new Error("Ruta no encontrada");

        }

        await routeRepository.update(id, data);

        return await routeRepository.findById(id);

    }

    async delete(id: number) {

        const route = await routeRepository.findById(id);

        if (!route) {

            throw new Error("Ruta no encontrada");

        }

        await routeRepository.delete(id);

        return {

            success: true,

            message: "Ruta eliminada correctamente"

        };

    }

}

export default new RouteService();
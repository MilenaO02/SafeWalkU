import contactoRepository from "../repositories/contacto.repository.js";

type ContactInput = { nombre: string; telefono: string; parentesco: string };

class ContactoService {
    getMine(userId: number) {
        return contactoRepository.findByUserId(userId);
    }

    async create(data: ContactInput, userId: number) {
        if (await contactoRepository.countByUser(userId) >= 20) {
            throw new Error("Cada usuario puede registrar un máximo de 20 contactos");
        }
        const id = await contactoRepository.create({ ...data, id_usuario: userId });
        return contactoRepository.findById(id);
    }

    async update(id: number, data: Partial<ContactInput>, userId: number) {
        const contact = await contactoRepository.findById(id);
        if (!contact) throw new Error("Contacto no encontrado");
        if (contact.id_usuario !== userId) throw new Error("No puede modificar un contacto ajeno");
        return contactoRepository.update(id, data, userId);
    }

    async delete(id: number, userId: number) {
        const contact = await contactoRepository.findById(id);
        if (!contact) throw new Error("Contacto no encontrado");
        if (contact.id_usuario !== userId) throw new Error("No puede eliminar un contacto ajeno");
        await contactoRepository.delete(id, userId);
    }
}

export default new ContactoService();

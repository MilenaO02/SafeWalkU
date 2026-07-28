import repository from "../repositories/user.repository.js";
import type { Usuario, UserRole } from "../repositories/user.repository.js";

/** Fields a user may update on their own profile */
export interface UpdateProfileInput {
    nombre?:   string;
    apellido?: string;
    correo?:   string;
}

/** Fields an admin may update on any user profile */
export interface AdminUpdateUserInput extends UpdateProfileInput {
    rol?:    UserRole;
    estado?: "ACTIVO" | "INACTIVO";
}

/** Minimal shape returned from getById / getAll */
export interface PublicUser {
    id_usuario:      number;
    nombre:          string;
    apellido:        string;
    correo:          string;
    rol:             UserRole;
    estado:          "ACTIVO" | "INACTIVO";
    fecha_registro?: Date | string;
    foto_perfil?:    string | null;
}

class UserService {
    async getAll(): Promise<PublicUser[]> {
        return repository.findAll();
    }

    async getById(id: number): Promise<PublicUser | undefined> {
        return repository.findById(id);
    }

    async getAvailableRoles(id: number): Promise<UserRole[]> {
        return repository.findAvailableRoles(id);
    }

    async update(id: number, data: UpdateProfileInput): Promise<PublicUser | undefined> {
        if (data.correo) {
            const existing = await repository.findByEmail(data.correo);
            if (existing && existing.id_usuario !== id) {
                throw new Error("Correo ya registrado");
            }
        }
        return repository.update(id, data as Partial<Usuario>);
    }

    async delete(id: number): Promise<boolean> {
        return repository.delete(id);
    }

    async updateFotoPerfil(id: number, foto_perfil: string): Promise<PublicUser | undefined> {
        return repository.updateFotoPerfil(id, foto_perfil);
    }
}

export default new UserService();

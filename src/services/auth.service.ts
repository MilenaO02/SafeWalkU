import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import repository from "../repositories/user.repository";
import { isValidUideEmail } from "../middleware/validateDomain";

class AuthService {
    async register(data: any) {
        const correo = (data.correo ?? data.email ?? "").toString().trim().toLowerCase();

        if (!isValidUideEmail(correo)) {
            throw new Error("Solo se permiten correos institucionales @uide.edu.ec");
        }

        const existe = await repository.findByEmail(correo);

        if (existe) {
            throw new Error("Correo ya registrado");
        }

        const password = await bcrypt.hash(data.contrasena ?? data.password, 10);
        const rol = (data.rol ?? "ESTUDIANTE").toString().toUpperCase();

        const id = await repository.create({
            ...data,
            correo,
            contrasena: password,
            rol
        });

        return {
            id,
            correo
        };
    }

    async login(correo: string, contrasena: string) {
        const normalizedCorreo = correo?.toString().trim().toLowerCase() ?? "";

        if (!isValidUideEmail(normalizedCorreo)) {
            throw new Error("Solo se permiten correos institucionales @uide.edu.ec");
        }

        const usuario = await repository.findByEmail(normalizedCorreo);

        if (!usuario) {
            throw new Error("Usuario no encontrado");
        }

        const ok = await bcrypt.compare(contrasena, usuario.contrasena);

        if (!ok) {
            throw new Error("Contraseña incorrecta");
        }

        const jwtSecret = process.env.JWT_SECRET;

        if (!jwtSecret) {
            throw new Error("Configuración de JWT incompleta");
        }

        const signOptions: jwt.SignOptions = {
            expiresIn: "2h"
        };

        const token = jwt.sign(
            {
                id_usuario: usuario.id_usuario,
                correo: usuario.correo,
                rol: usuario.rol
            },
            jwtSecret,
            signOptions
        );

        const { contrasena: _, ...usuarioSeguro } = usuario;

        return {
            token,
            usuario: usuarioSeguro
        };
    }
}

export default new AuthService();
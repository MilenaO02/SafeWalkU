import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import repository from "../repositories/user.repository";
import type { StringValue } from "ms";
class AuthService {

    async register(data: any) {

        const existe = await repository.findByEmail(data.correo);

        if (existe) {
            throw new Error("Correo ya registrado");
        }

        const password = await bcrypt.hash(data.contrasena, 10);

        data.contrasena = password;

        const id = await repository.create(data);

        return {
            id
        };

    }

    async login(correo: string, contrasena: string) {

        const usuario = await repository.findByEmail(correo);

        if (!usuario) {
            throw new Error("Usuario no encontrado");
        }

        const ok = await bcrypt.compare(
            contrasena,
            usuario.contrasena
        );

        if (!ok) {
            throw new Error("Contraseña incorrecta");
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
         process.env.JWT_SECRET as string,
         signOptions
       );

        // Nunca devolver la contraseña
        const { contrasena: _, ...usuarioSeguro } = usuario;

        return {

            token,

            usuario: usuarioSeguro

        };

    }

}

export default new AuthService();
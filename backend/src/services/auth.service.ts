import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import repository from "../repositories/user.repository.js";
import { isValidUideEmail } from "../middleware/validateDomain.js";
import { getJwtSecret } from "../config/security.js";

export class InvalidCredentialsError extends Error {
    constructor() {
        super("Credenciales incorrectas");
        this.name = "InvalidCredentialsError";
    }
}

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

        const password = await bcrypt.hash(data.contrasena, 12);

        const id = await repository.create({
            ...data,
            correo,
            contrasena: password,
            rol: "ESTUDIANTE"
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

        // Ejecutar bcrypt incluso si el correo no existe reduce diferencias de tiempo
        // que podrían utilizarse para enumerar cuentas registradas.
        const dummyHash = "$2b$12$0gY3X44P2MOw19C3at5yQe1mILPz9EAbg8QzydqH7/dMU42trqt7G";
        const ok = await bcrypt.compare(contrasena, usuario?.contrasena ?? dummyHash);

        if (!usuario || !ok || usuario.estado !== "ACTIVO") {
            throw new InvalidCredentialsError();
        }

        const jwtSecret = getJwtSecret();

        const signOptions: jwt.SignOptions = {
            algorithm: "HS256",
            expiresIn: (process.env.JWT_EXPIRES || "2h") as jwt.SignOptions["expiresIn"]
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

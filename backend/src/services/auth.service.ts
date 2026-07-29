import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import repository from "../repositories/user.repository.js";
import type { UserRole } from "../repositories/user.repository.js";
import { isValidUideEmail } from "../middleware/validateDomain.js";
import { getJwtSecret } from "../config/security.js";

export class InvalidCredentialsError extends Error {
    constructor() {
        super("Credenciales incorrectas");
        this.name = "InvalidCredentialsError";
    }
}

export class InvalidSessionError extends Error {
    constructor() {
        super("Sesión no válida");
        this.name = "InvalidSessionError";
    }
}

export class RoleNotAllowedError extends Error {
    constructor() {
        super("El modo solicitado no está autorizado para esta cuenta");
        this.name = "RoleNotAllowedError";
    }
}

class AuthService {
    private createToken(usuario: { id_usuario: number; correo: string }, rol: UserRole): string {
        const signOptions: jwt.SignOptions = {
            algorithm: "HS256",
            expiresIn: (process.env.JWT_EXPIRES || "2h") as jwt.SignOptions["expiresIn"]
        };

        return jwt.sign(
            {
                id_usuario: usuario.id_usuario,
                correo: usuario.correo,
                rol
            },
            getJwtSecret(),
            signOptions
        );
    }

    private withoutPassword(
        usuario: { contrasena?: string; [key: string]: unknown },
        rol: UserRole,
        roles: UserRole[]
    ) {
        const { contrasena: _, ...usuarioSeguro } = usuario;
        return { ...usuarioSeguro, rol, roles };
    }

    async register(data: {
        correo?:    string;
        email?:     string;
        contrasena: string;
        nombre:     string;
        apellido:   string;
    }) {
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

        const roles = await repository.findAvailableRoles(usuario.id_usuario);
        const activeRole = usuario.rol as UserRole;
        const token = this.createToken(usuario, activeRole);

        return {
            token,
            usuario: this.withoutPassword(usuario, activeRole, roles)
        };
    }

    async switchRole(idUsuario: number, requestedRole: UserRole) {
        const usuario = await repository.findById(idUsuario);

        if (!usuario || usuario.estado !== "ACTIVO") {
            throw new InvalidSessionError();
        }

        const roles = await repository.findAvailableRoles(idUsuario);
        if (!roles.includes(requestedRole)) {
            throw new RoleNotAllowedError();
        }

        return {
            token: this.createToken(usuario, requestedRole),
            usuario: this.withoutPassword(usuario, requestedRole, roles)
        };
    }
}

export default new AuthService();

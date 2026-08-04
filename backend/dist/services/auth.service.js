import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import repository from "../repositories/user.repository.js";
import { isValidUideEmail } from "../middleware/validateDomain.js";
import { getJwtSecret } from "../config/security.js";
import { createHash, randomBytes } from "node:crypto";
import passwordResetRepository from "../repositories/password-reset.repository.js";
import emailService from "./email.service.js";
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
export class PasswordResetUnavailableError extends Error {
    constructor() {
        super("El servicio de recuperacion no esta disponible. Contacta a Soporte TI.");
        this.name = "PasswordResetUnavailableError";
    }
}
export class InvalidPasswordResetTokenError extends Error {
    constructor() {
        super("El enlace de recuperacion es invalido o ya vencio");
        this.name = "InvalidPasswordResetTokenError";
    }
}
class AuthService {
    createToken(usuario, rol) {
        const signOptions = {
            algorithm: "HS256",
            expiresIn: (process.env.JWT_EXPIRES || "2h")
        };
        return jwt.sign({
            id_usuario: usuario.id_usuario,
            correo: usuario.correo,
            rol
        }, getJwtSecret(), signOptions);
    }
    withoutPassword(usuario, rol, roles) {
        const { contrasena: _, ...usuarioSeguro } = usuario;
        return { ...usuarioSeguro, rol, roles };
    }
    async register(data) {
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
    async login(correo, contrasena) {
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
        const activeRole = usuario.rol;
        const token = this.createToken(usuario, activeRole);
        return {
            token,
            usuario: this.withoutPassword(usuario, activeRole, roles)
        };
    }
    async switchRole(idUsuario, requestedRole) {
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
    async requestPasswordReset(correo) {
        if (!emailService.isConfigured()) {
            throw new PasswordResetUnavailableError();
        }
        const normalizedCorreo = correo.trim().toLowerCase();
        const usuario = await repository.findByEmail(normalizedCorreo);
        if (!usuario || usuario.estado !== "ACTIVO") {
            return;
        }
        const token = randomBytes(32).toString("hex");
        const tokenHash = createHash("sha256").update(token).digest("hex");
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
        await passwordResetRepository.create(usuario.id_usuario, tokenHash, expiresAt);
        const appUrl = (process.env.APP_URL || "https://safewalku.online").replace(/\/$/, "");
        const resetUrl = `${appUrl}/login?reset_token=${token}`;
        try {
            await emailService.sendPasswordResetEmail(usuario.correo, resetUrl);
        }
        catch (error) {
            await passwordResetRepository.revoke(tokenHash);
            throw new PasswordResetUnavailableError();
        }
    }
    async confirmPasswordReset(token, contrasena) {
        const tokenHash = createHash("sha256").update(token).digest("hex");
        const passwordHash = await bcrypt.hash(contrasena, 12);
        const updated = await passwordResetRepository.consumeAndUpdatePassword(tokenHash, passwordHash);
        if (!updated) {
            throw new InvalidPasswordResetTokenError();
        }
    }
}
export default new AuthService();

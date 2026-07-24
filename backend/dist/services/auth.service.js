"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_repository_1 = __importDefault(require("../repositories/user.repository"));
const validateDomain_1 = require("../middleware/validateDomain");
class AuthService {
    async register(data) {
        const correo = (data.correo ?? data.email ?? "").toString().trim().toLowerCase();
        if (!(0, validateDomain_1.isValidUideEmail)(correo)) {
            throw new Error("Solo se permiten correos institucionales @uide.edu.ec");
        }
        const existe = await user_repository_1.default.findByEmail(correo);
        if (existe) {
            throw new Error("Correo ya registrado");
        }
        const password = await bcrypt_1.default.hash(data.contrasena ?? data.password, 10);
        const rol = (data.rol ?? "ESTUDIANTE").toString().toUpperCase();
        const id = await user_repository_1.default.create({
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
    async login(correo, contrasena) {
        const normalizedCorreo = correo?.toString().trim().toLowerCase() ?? "";
        if (!(0, validateDomain_1.isValidUideEmail)(normalizedCorreo)) {
            throw new Error("Solo se permiten correos institucionales @uide.edu.ec");
        }
        const usuario = await user_repository_1.default.findByEmail(normalizedCorreo);
        if (!usuario) {
            throw new Error("Usuario no encontrado");
        }
        if (usuario.estado && usuario.estado !== "ACTIVO") {
            throw new Error("La cuenta está inactiva. Contacta al administrador.");
        }
        const ok = await bcrypt_1.default.compare(contrasena, usuario.contrasena);
        if (!ok) {
            throw new Error("Contraseña incorrecta");
        }
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error("Configuración de JWT incompleta");
        }
        const signOptions = {
            expiresIn: "30d"
        };
        const token = jsonwebtoken_1.default.sign({
            id_usuario: usuario.id_usuario,
            correo: usuario.correo,
            rol: usuario.rol
        }, jwtSecret, signOptions);
        const { contrasena: _, ...usuarioSeguro } = usuario;
        return {
            token,
            usuario: usuarioSeguro
        };
    }
}
exports.default = new AuthService();

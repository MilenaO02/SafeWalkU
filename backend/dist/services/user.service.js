"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_repository_1 = __importDefault(require("../repositories/user.repository"));
class UserService {
    async getAll() {
        return await user_repository_1.default.findAll();
    }
    async getById(id) {
        return await user_repository_1.default.findById(id);
    }
    async update(id, data) {
        return await user_repository_1.default.update(id, data);
    }
    async delete(id) {
        return await user_repository_1.default.delete(id);
    }
    async updateFotoPerfil(id, foto_perfil) {
        return await user_repository_1.default.updateFotoPerfil(id, foto_perfil);
    }
}
exports.default = new UserService();

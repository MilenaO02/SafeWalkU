"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const logger_1 = __importDefault(require("../utils/logger"));
function default_1(req, res, next) {
    (0, logger_1.default)(req.method, req.originalUrl);
    next();
}

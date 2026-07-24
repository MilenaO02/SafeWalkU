"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const path_1 = __importDefault(require("path"));
const swagger_1 = __importDefault(require("./docs/swagger"));
const routes_1 = __importDefault(require("./routes"));
const rateLimiter_1 = __importDefault(require("./middleware/rateLimiter"));
const logger_1 = __importDefault(require("./middleware/logger"));
const errorHandler_1 = __importDefault(require("./middleware/errorHandler"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173,https://localhost:5173").split(",").map((origin) => origin.trim()).filter(Boolean);
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    credentials: true
}));
app.use(express_1.default.json());
app.use(logger_1.default);
app.use(rateLimiter_1.default);
// Servir imágenes de perfil cargadas localmente
app.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "../uploads")));
app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.default));
app.use("/api", routes_1.default);
app.get("/", (req, res) => {
    res.json({
        nombre: "SafeWalk API",
        version: "1.0.0",
        estado: "Funcionando"
    });
});
app.use(errorHandler_1.default);
exports.default = app;

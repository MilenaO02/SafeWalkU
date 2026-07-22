"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const database_1 = __importDefault(require("./config/database"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const PORT = process.env.PORT || 3000;
// Verificar conexión a MySQL antes de aceptar tráfico
database_1.default.query("SELECT 1")
    .then(() => {
    console.log("--------------------------------");
    console.log("✅ Base de datos conectada");
    console.log("--------------------------------");
})
    .catch((err) => {
    console.error("❌ Error de conexión a MySQL:", err.message);
    console.error("   Verifica las variables DB_HOST, DB_USER, DB_PASSWORD, DB_NAME en .env");
});
app_1.default.listen(PORT, () => {
    console.log("--------------------------------");
    console.log("SafeWalk API");
    console.log(`Servidor: http://localhost:${PORT}`);
    console.log("--------------------------------");
});

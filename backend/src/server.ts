import app from "./app";
import pool from "./config/database";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 3000;

// Verificar conexión a MySQL antes de aceptar tráfico
pool.query("SELECT 1")
    .then(() => {
        console.log("--------------------------------");
        console.log("Base de datos conectada");
        console.log("--------------------------------");
    })
    .catch((err: any) => {
        console.error("Error de conexión a MySQL:", err.message);
        console.error("   Verifica las variables DB_HOST, DB_USER, DB_PASSWORD, DB_NAME en .env");
    });

app.listen(PORT, () => {

    console.log("--------------------------------");

    console.log("SafeWalk API");

    console.log(`Servidor: http://localhost:${PORT}`);

    console.log("--------------------------------");

});
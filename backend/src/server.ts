import app from "./app.js";
import pool from "./config/database.js";
import dotenv from "dotenv";

dotenv.config();

const port = Number(process.env.PORT ?? 3000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT debe ser un puerto válido entre 1 y 65535");
}

async function startServer(): Promise<void> {
    try {
        // No se acepta tráfico hasta comprobar que MySQL está disponible.
        await pool.query("SELECT 1");

        app.listen(port, () => {
            console.log("--------------------------------");
            console.log("SafeWalk API");
            console.log("Base de datos conectada");
            console.log(`Servidor: http://localhost:${port}`);
            console.log("--------------------------------");
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Error desconocido";
        console.error("No se pudo iniciar SafeWalk API:", message);
        console.error("Verifica DB_HOST, DB_PORT, DB_USER, DB_PASSWORD y DB_NAME en .env");
        await pool.end();
        process.exitCode = 1;
    }
}

void startServer();

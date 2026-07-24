import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const dbPort = Number(process.env.DB_PORT ?? 3306);
const connectionLimit = Number(process.env.DB_CONNECTION_LIMIT ?? 10);
const connectTimeout = Number(process.env.DB_CONNECT_TIMEOUT_MS ?? 5000);

if (!Number.isInteger(dbPort) || dbPort < 1 || dbPort > 65535) {
    throw new Error("DB_PORT debe ser un puerto válido entre 1 y 65535");
}

if (!Number.isInteger(connectionLimit) || connectionLimit < 1) {
    throw new Error("DB_CONNECTION_LIMIT debe ser un entero mayor que 0");
}

if (!Number.isFinite(connectTimeout) || connectTimeout < 1000) {
    throw new Error("DB_CONNECT_TIMEOUT_MS debe ser un número mayor o igual a 1000");
}

const pool = mysql.createPool({
    host: process.env.DB_HOST || "127.0.0.1",
    port: dbPort,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "safewalku",
    waitForConnections: true,
    connectionLimit,
    connectTimeout,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

export default pool;

import dotenv from "dotenv";
import mysql from "mysql2/promise";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

// En produccion el archivo de secretos vive en ~/safewalku/.env, un nivel
// por encima del backend. En desarrollo se conserva backend/.env.
dotenv.config({ path: resolve(process.cwd(), ".env") });
dotenv.config({ path: resolve(process.cwd(), "../.env") });

// Algunas instalaciones antiguas guardan los secretos solamente en PM2.
// Recuperamos unicamente las variables de base de datos y nunca las mostramos.
if (!process.env.DB_USER || !process.env.DB_PASSWORD) {
    try {
        const processes = JSON.parse(execFileSync("pm2", ["jlist"], {
            encoding: "utf8",
            stdio: ["ignore", "pipe", "ignore"]
        }));
        const backendProcess = processes.find((entry) => entry.name === "safewalk-backend");
        const runtimeEnvironment = backendProcess?.pm2_env ?? {};
        const environmentDirectories = [
            runtimeEnvironment.pm_cwd,
            runtimeEnvironment.pm_exec_path ? dirname(runtimeEnvironment.pm_exec_path) : undefined
        ].filter(Boolean);
        for (const directory of environmentDirectories) {
            dotenv.config({ path: resolve(directory, ".env") });
        }
        for (const name of ["DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME"]) {
            if (!process.env[name] && runtimeEnvironment[name] !== undefined) {
                process.env[name] = String(runtimeEnvironment[name]);
            }
        }
    } catch {
        // La validacion inferior produce un mensaje claro si tampoco existe PM2.
    }
}

// Ultimo respaldo para la instalacion Docker original: obtiene las
// credenciales del contenedor MySQL local sin escribirlas en la salida.
if (!process.env.DB_USER || !process.env.DB_PASSWORD) {
    try {
        const containerId = execFileSync("sudo", [
            "-n", "docker", "ps", "--filter", "name=mysql", "--format", "{{.ID}}"
        ], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim().split(/\s+/)[0];
        if (containerId) {
            const details = JSON.parse(execFileSync("sudo", ["-n", "docker", "inspect", containerId], {
                encoding: "utf8",
                stdio: ["ignore", "pipe", "ignore"]
            }));
            const containerEnvironment = Object.fromEntries(
                (details[0]?.Config?.Env ?? []).map((entry) => {
                    const separator = entry.indexOf("=");
                    return separator === -1 ? [entry, ""] : [entry.slice(0, separator), entry.slice(separator + 1)];
                })
            );
            process.env.DB_USER ||= containerEnvironment.MYSQL_USER || "root";
            process.env.DB_PASSWORD ||= containerEnvironment.MYSQL_PASSWORD || containerEnvironment.MYSQL_ROOT_PASSWORD;
            process.env.DB_NAME ||= containerEnvironment.MYSQL_DATABASE || "safewalku";
        }
    } catch {
        // La validacion inferior informa si no existe otra fuente de secretos.
    }
}

const requiredVariables = ["DB_USER", "DB_PASSWORD"];
const missingVariables = requiredVariables.filter((name) => !process.env[name]);
if (missingVariables.length > 0) {
    throw new Error(`Faltan variables de base de datos: ${missingVariables.join(", ")}`);
}

const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "safewalku",
    multipleStatements: true
});

try {
    for (const migration of [
        "005_add_route_geometry.sql",
        "006_correct_verified_locations.sql",
        "007_remove_university_gate.sql",
        "008_reconcile_legacy_schema.sql"
    ]) {
        const sql = await readFile(resolve(import.meta.dirname, `../db/migrations/${migration}`), "utf8");
        await connection.query(sql.replace(/^USE\s+`?safewalku`?;/im, ""));
        console.log(`Migracion aplicada: ${migration}`);
    }
} finally {
    await connection.end();
}

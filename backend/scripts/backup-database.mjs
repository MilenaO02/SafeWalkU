import dotenv from "dotenv";
import mysql from "mysql2/promise";
import { spawn, execFileSync } from "node:child_process";
import { createWriteStream } from "node:fs";
import { mkdir, rename, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pipeline } from "node:stream/promises";
import { createGzip } from "node:zlib";

dotenv.config({ path: resolve(process.cwd(), ".env") });
dotenv.config({ path: resolve(process.cwd(), "../.env") });

if (!process.env.DB_USER || process.env.DB_PASSWORD === undefined) {
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
            if (process.env[name] === undefined && runtimeEnvironment[name] !== undefined) {
                process.env[name] = String(runtimeEnvironment[name]);
            }
        }
    } catch {
        // La validacion inferior informa si no existe una fuente utilizable.
    }
}

if (!process.env.DB_USER || process.env.DB_PASSWORD === undefined) {
    throw new Error("No se encontraron las credenciales de MySQL para crear el respaldo.");
}

const connectionOptions = {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "safewalku"
};

const connection = await mysql.createConnection(connectionOptions);
let cleanupPending;
try {
    const [rows] = await connection.query(`
        SELECT (
            (SELECT COUNT(*) FROM usuario
             WHERE id_usuario BETWEEN 1 AND 24 AND id_usuario <> 14)
            + (SELECT COUNT(*) FROM usuario
               WHERE id_usuario = 14
                 AND (rol <> 'ESTUDIANTE' OR estado <> 'INACTIVO'))
            + (SELECT COUNT(*) FROM administrador WHERE id_usuario BETWEEN 1 AND 24)
            + (SELECT COUNT(*) FROM reporte WHERE id_usuario BETWEEN 1 AND 24)
            + (SELECT COUNT(*) FROM evidencia
               WHERE url_archivo LIKE 'https://safewalk.com/evidencias/%')
            + (SELECT COUNT(*) FROM contactoemergencia WHERE id_usuario BETWEEN 1 AND 24)
            + (SELECT COUNT(*) FROM rutafavorita WHERE id_usuario BETWEEN 1 AND 24)
            + (SELECT COUNT(*) FROM compartirubicacion WHERE id_usuario BETWEEN 1 AND 24)
            + (SELECT COUNT(*) FROM servicioemergencia
               WHERE id_servicio = 18
                 AND nombre = 'Hospital Universitario'
                 AND id_ubicacion = 9)
        ) AS pending_records
    `);
    cleanupPending = Number(rows[0].pending_records) > 0;
} finally {
    await connection.end();
}

if (!cleanupPending) {
    console.log("La limpieza demo ya fue aplicada; no se requiere otro respaldo para la migracion 009.");
    process.exit(0);
}

const backupDirectory = resolve(process.cwd(), "../backups/mysql");
const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
const finalPath = resolve(backupDirectory, `safewalku_before_migration_${timestamp}.sql.gz`);
const temporaryPath = `${finalPath}.tmp`;
const databaseName = connectionOptions.database;

await mkdir(backupDirectory, { recursive: true });

const dump = spawn("mysqldump", [
    `--host=${process.env.DB_HOST || "127.0.0.1"}`,
    `--port=${process.env.DB_PORT || "3306"}`,
    `--user=${process.env.DB_USER}`,
    "--single-transaction",
    "--routines",
    "--triggers",
    databaseName
], {
    env: { ...process.env, MYSQL_PWD: process.env.DB_PASSWORD },
    stdio: ["ignore", "pipe", "pipe"]
});

let diagnostic = "";
dump.stderr.setEncoding("utf8");
dump.stderr.on("data", (chunk) => {
    diagnostic = `${diagnostic}${chunk}`.slice(-4000);
});

const processFinished = new Promise((resolveProcess, rejectProcess) => {
    dump.once("error", rejectProcess);
    dump.once("close", (code) => {
        if (code === 0) resolveProcess();
        else rejectProcess(new Error(`mysqldump termino con codigo ${code}: ${diagnostic.trim()}`));
    });
});

try {
    await Promise.all([
        pipeline(dump.stdout, createGzip(), createWriteStream(temporaryPath, { mode: 0o600 })),
        processFinished
    ]);
    await rename(temporaryPath, finalPath);
    console.log(`Respaldo MySQL verificado: ${finalPath}`);
} catch (error) {
    dump.kill();
    await rm(temporaryPath, { force: true });
    throw error;
}

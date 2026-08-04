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

const legacyMigrations = [
        "005_add_route_geometry.sql",
        "006_correct_verified_locations.sql",
        "007_remove_university_gate.sql",
        "008_reconcile_legacy_schema.sql",
        "009_remove_demo_data.sql",
        "010_authorize_dual_role_admin.sql",
        "011_add_route_endpoint_metadata.sql"
    ];

// En despliegues normales se aplican exclusivamente migraciones nuevas e
// idempotentes. Las migraciones de limpieza/autorizacion historicas se dejan
// disponibles para una instalacion antigua que las necesite expresamente.
const migrations = process.env.SAFEWALK_SKIP_LEGACY_MIGRATIONS === "1"
    ? ["014_add_location_lifecycle.sql", "015_add_password_reset_tokens.sql"]
    : [...legacyMigrations, "014_add_location_lifecycle.sql", "015_add_password_reset_tokens.sql"];

try {
    for (const migration of migrations) {
        const sql = await readFile(resolve(import.meta.dirname, `../db/migrations/${migration}`), "utf8");
        const migrationSql = sql.replace(/^USE\s+`?safewalku`?;/im, "");

        if (migration === "009_remove_demo_data.sql") {
            await connection.beginTransaction();
            try {
                await connection.query(migrationSql);
                const [verificationRows] = await connection.query(`
                    SELECT
                        (SELECT COUNT(*) FROM usuario
                         WHERE id_usuario BETWEEN 1 AND 24 AND id_usuario <> 14) AS demo_users,
                        (SELECT COUNT(*) FROM usuario
                         WHERE id_usuario = 14
                           AND (rol <> 'ESTUDIANTE' OR estado <> 'INACTIVO')) AS user_14_invalid,
                        (SELECT COUNT(*) FROM usuario
                         WHERE id_usuario = 14) AS user_14_count,
                        (SELECT COUNT(*) FROM administrador a
                         INNER JOIN usuario u ON u.id_usuario = a.id_usuario
                         WHERE u.id_usuario BETWEEN 1 AND 24) AS demo_admins,
                        (SELECT COUNT(*) FROM reporte
                         WHERE id_usuario BETWEEN 1 AND 24) AS demo_reports,
                        (SELECT COUNT(*) FROM evidencia
                         WHERE url_archivo LIKE 'https://safewalk.com/evidencias/%') AS fake_evidence,
                        (SELECT COUNT(*) FROM contactoemergencia
                         WHERE id_usuario BETWEEN 1 AND 24) AS demo_contacts,
                        (SELECT COUNT(*) FROM rutafavorita
                         WHERE id_usuario BETWEEN 1 AND 24) AS demo_favorites,
                        (SELECT COUNT(*) FROM compartirubicacion
                         WHERE id_usuario BETWEEN 1 AND 24) AS demo_shares,
                        (SELECT COUNT(*) FROM servicioemergencia
                         WHERE id_servicio = 18
                           AND nombre = 'Hospital Universitario'
                           AND id_ubicacion = 9) AS inconsistent_service,
                        (SELECT COUNT(*) FROM (
                            SELECT contrasena
                            FROM usuario
                            WHERE estado = 'ACTIVO'
                            GROUP BY contrasena
                            HAVING COUNT(*) > 1
                         ) AS shared_password_groups) AS active_shared_password_groups,
                        (SELECT COUNT(*) FROM usuario WHERE id_usuario = 27) AS real_user_27
                `);
                const verification = verificationRows[0];
                const expectedOne = new Set(["user_14_count", "real_user_27"]);
                const invalidResults = Object.entries(verification).filter(([key, value]) => (
                    expectedOne.has(key) ? Number(value) !== 1 : Number(value) !== 0
                ));
                if (invalidResults.length > 0) {
                    throw new Error(`La verificacion de limpieza fallo: ${JSON.stringify(verification)}`);
                }
                await connection.commit();
                console.log("Limpieza demo verificada; usuario real 27 preservado.");
            } catch (error) {
                await connection.rollback();
                throw error;
            }
        } else if (migration === "010_authorize_dual_role_admin.sql") {
            await connection.beginTransaction();
            try {
                await connection.query(migrationSql);
                const [verificationRows] = await connection.query(`
                    SELECT
                        (SELECT COUNT(*)
                         FROM usuario
                         WHERE id_usuario = 27
                           AND correo = 'miordonezle@uide.edu.ec'
                           AND rol = 'ESTUDIANTE'
                           AND estado = 'ACTIVO') AS student_account,
                        (SELECT COUNT(*)
                         FROM administrador
                         WHERE id_usuario = 27
                           AND cargo = 'Administradora del sistema SafeWalk U') AS admin_authorization
                `);
                const verification = verificationRows[0];
                if (Number(verification.student_account) !== 1 || Number(verification.admin_authorization) !== 1) {
                    throw new Error(`La verificación del acceso dual falló: ${JSON.stringify(verification)}`);
                }
                await connection.commit();
                console.log("Acceso dual verificado; usuario 27 conserva el rol ESTUDIANTE.");
            } catch (error) {
                await connection.rollback();
                throw error;
            }
        } else {
            await connection.query(migrationSql);
        }
        console.log(`Migracion aplicada: ${migration}`);
    }
} finally {
    await connection.end();
}

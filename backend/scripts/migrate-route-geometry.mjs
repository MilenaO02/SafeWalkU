import "dotenv/config";
import mysql from "mysql2/promise";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "safewalku",
    multipleStatements: true
});

try {
    for (const migration of ["005_add_route_geometry.sql", "006_correct_verified_locations.sql", "007_remove_university_gate.sql"]) {
        const sql = await readFile(resolve(import.meta.dirname, `../db/migrations/${migration}`), "utf8");
        await connection.query(sql.replace(/^USE\s+`?safewalku`?;/im, ""));
        console.log(`Migracion aplicada: ${migration}`);
    }
} finally {
    await connection.end();
}

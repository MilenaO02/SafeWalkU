import "dotenv/config";
import mysql from "mysql2/promise";

const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "safewalku"
});

try {
    const [columns] = await connection.query(
        `SELECT COLUMN_NAME
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'coordenada'
           AND COLUMN_NAME IN ('verificada', 'fuente')`
    );
    const existingColumns = new Set(columns.map((column) => column.COLUMN_NAME));

    if (!existingColumns.has("verificada")) {
        await connection.query(
            "ALTER TABLE coordenada ADD COLUMN verificada TINYINT(1) NOT NULL DEFAULT 0"
        );
    }
    if (!existingColumns.has("fuente")) {
        await connection.query(
            "ALTER TABLE coordenada ADD COLUMN fuente VARCHAR(100) DEFAULT NULL"
        );
    }

    await connection.query(
        `UPDATE coordenada
         SET verificada = 1,
             fuente = COALESCE(fuente, 'Municipio de Loja / ficha geografica publica')
         WHERE id_ubicacion = 7`
    );
    await connection.query(
        `UPDATE coordenada
         SET verificada = 1,
             fuente = COALESCE(fuente, 'Estudio UNL / cartografia OpenStreetMap')
         WHERE id_ubicacion = 9`
    );

    console.log("Migración de ubicaciones aplicada: verificada y fuente disponibles.");
} finally {
    await connection.end();
}

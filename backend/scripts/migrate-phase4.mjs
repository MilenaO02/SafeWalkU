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
    const [reportColumns] = await connection.query(
        `SELECT COLUMN_NAME
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reporte'
           AND COLUMN_NAME IN ('tipo_reporte', 'estado_registro')`
    );
    const existingReportColumns = new Set(reportColumns.map((column) => column.COLUMN_NAME));

    if (!existingReportColumns.has("tipo_reporte")) {
        await connection.query("ALTER TABLE reporte ADD COLUMN tipo_reporte ENUM('INCIDENTE', 'SOS_PANICO') NOT NULL DEFAULT 'INCIDENTE'");
    }
    if (!existingReportColumns.has("estado_registro")) {
        await connection.query("ALTER TABLE reporte ADD COLUMN estado_registro ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO'");
    }

    const [columns] = await connection.query(
        `SELECT COLUMN_NAME
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ubicacion'
           AND COLUMN_NAME IN ('ciudad', 'radio_metros')`
    );
    const existingColumns = new Set(columns.map((column) => column.COLUMN_NAME));

    if (!existingColumns.has("ciudad")) {
        await connection.query("ALTER TABLE ubicacion ADD COLUMN ciudad VARCHAR(100) NOT NULL DEFAULT 'Loja'");
    }
    if (!existingColumns.has("radio_metros")) {
        await connection.query("ALTER TABLE ubicacion ADD COLUMN radio_metros INT NOT NULL DEFAULT 50");
    }

    await connection.query(`
        ALTER TABLE reporte
        MODIFY COLUMN estado ENUM(
            'PENDIENTE', 'VALIDADO', 'RECHAZADO', 'DUPLICADO', 'CANCELADO'
        ) NOT NULL DEFAULT 'PENDIENTE'
    `);
    console.log("Migración de fase 4 aplicada: estado CANCELADO disponible.");
} finally {
    await connection.end();
}

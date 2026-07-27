import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function read(relativePath) {
    return readFile(path.join(backendDir, relativePath), "utf8");
}

const schema = await read("db/schema.sql");
const seed = await read("db/seed.sql");
const envExample = await read(".env.example");

const tables = [...schema.matchAll(/CREATE TABLE `([^`]+)`/g)].map((match) => match[1]);
assert.equal(tables.length, 14, "schema.sql debe definir las 14 tablas del modelo");
assert.equal(new Set(tables).size, tables.length, "No deben existir tablas duplicadas");

for (const constraint of [
    "idx_usuario_correo",
    "idx_ruta_orden",
    "idx_rutapunto_orden",
    "idx_favorita_usuario_ruta",
    "fk_compartir_contacto_usuario",
    "chk_coordenada_latitud",
    "chk_coordenada_longitud"
]) {
    assert.ok(schema.includes(constraint), `Falta la restricción ${constraint}`);
}

for (const variable of [
    "PORT",
    "DB_HOST",
    "DB_PORT",
    "DB_USER",
    "DB_PASSWORD",
    "DB_NAME",
    "DB_CONNECTION_LIMIT",
    "DB_CONNECT_TIMEOUT_MS",
    "JWT_SECRET",
    "JWT_EXPIRES",
    "CORS_ORIGIN"
]) {
    assert.match(envExample, new RegExp(`^${variable}=`, "m"), `.env.example no contiene ${variable}`);
}

const expectedRouteDestinations = new Map([
    [1, 7], [2, 6], [3, 4], [4, 12], [5, 13], [6, 14], [7, 9],
    [8, 8], [9, 15], [10, 11], [11, 5], [13, 10], [14, 16],
    [15, 17], [16, 20], [17, 19], [18, 7], [19, 22], [20, 21], [21, 12], [22, 2]
]);

const routeSection = seed.match(/INSERT INTO ruta_ubicacion[\s\S]*?;\s*\r?\n\r?\nINSERT INTO reporte/)?.[0] ?? "";
const routePoints = [...routeSection.matchAll(/\(\d+,(\d+),(\d+),(\d+)\)/g)].map((match) => ({
    routeId: Number(match[1]),
    locationId: Number(match[2]),
    order: Number(match[3])
}));

for (const [routeId, destinationId] of expectedRouteDestinations) {
    assert.ok(
        routePoints.some((point) => point.routeId === routeId && point.locationId === destinationId && point.order === 2),
        `La ruta ${routeId} no termina en la ubicación esperada ${destinationId}`
    );
}

const sourceGroups = ["controllers", "services"];
for (const group of sourceGroups) {
    const directory = path.join(backendDir, "src", group);
    const files = (await readdir(directory)).filter((file) => file.endsWith(".ts"));

    for (const file of files) {
        const source = await read(path.join("src", group, file));
        if (group === "controllers") {
            assert.doesNotMatch(source, /\.\.\/repositories\//, `${file} omite la capa de servicios`);
            assert.doesNotMatch(source, /\.\.\/config\/database/, `${file} accede directamente a la base de datos`);
        }
        if (group === "services") {
            assert.doesNotMatch(source, /\.\.\/config\/database/, `${file} omite la capa de repositorios`);
        }
    }
}

console.log("Fase 2 validada: esquema, seed, entorno y arquitectura por capas son coherentes.");

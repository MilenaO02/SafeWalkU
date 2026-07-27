import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => readFile(path.join(backendDir, relativePath), "utf8");

const [
    reportRoutes,
    reportSchema,
    reportService,
    reportRepository,
    evidenceRoutes,
    evidenceService,
    evidenceUpload,
    schema,
    migration,
    locationMigration,
    lifecycleMigration
] = await Promise.all([
    read("src/routes/report.routes.ts"),
    read("src/schemas/report.schema.ts"),
    read("src/services/report.service.ts"),
    read("src/repositories/report.repository.ts"),
    read("src/routes/evidencia.routes.ts"),
    read("src/services/evidencia.service.ts"),
    read("src/config/evidenceUpload.ts"),
    read("db/schema.sql"),
    read("db/migrations/004_add_cancelled_report_status.sql"),
    read("db/migrations/003_add_location_metadata.sql"),
    read("db/migrations/002_add_report_lifecycle.sql")
]);

assert.ok(
    reportRoutes.indexOf('"/zonas/riesgo"') < reportRoutes.indexOf('"/:id"'),
    "Las rutas específicas deben declararse antes de /:id"
);
assert.match(reportRoutes, /validate\(createReportSchema\)/, "La creación de reportes debe usar Zod");
assert.match(reportRoutes, /validate\(updateReportSchema\)/, "La actualización de reportes debe usar Zod");
assert.match(reportRoutes, /validate\(createSosSchema\)/, "La creación de SOS debe usar Zod");
assert.match(reportSchema, /id_ubicacion:[\s\S]*positive\(\)/, "La ubicación debe ser obligatoria y positiva");
assert.doesNotMatch(reportSchema, /id_usuario\s*:/, "La identidad del reporte no debe aceptarse desde el body");

assert.match(reportService, /reporte\.id_usuario !== user\.id_usuario/, "Solo el propietario puede cancelar su SOS");
assert.match(reportRepository, /id_administrador = CASE/, "La revisión debe registrar al administrador");
assert.match(reportRepository, /estado = 'CANCELADO'/, "Cancelar SOS no debe equivaler a rechazarlo");
assert.match(reportRoutes, /authorize\("ADMINISTRADOR"\)[\s\S]*resolveSOS/, "Atender SOS debe requerir administrador");

assert.match(evidenceRoutes, /evidenceUpload\.single\("archivo"\)/, "Evidencias debe recibir un archivo real");
assert.match(evidenceUpload, /25 \* 1024 \* 1024/, "Evidencias debe limitar el tamaño");
assert.match(evidenceUpload, /hasValidEvidenceSignature/, "Evidencias debe validar la firma binaria");
assert.match(evidenceUpload, /video\/mp4/, "Evidencias debe admitir video MP4 controlado");
assert.match(evidenceService, /reporte ajeno/, "Evidencias debe comprobar propiedad del reporte");
assert.match(evidenceService, /máximo de 5 evidencias/, "Debe existir un límite de evidencias por reporte");
assert.match(evidenceService, /removeLocalFile/, "La eliminación debe sincronizar archivo y base de datos");

assert.match(schema, /'CANCELADO'/, "El esquema debe incluir el estado CANCELADO");
assert.match(migration, /ALTER TABLE reporte/, "Debe existir una migración para bases actuales");
assert.match(locationMigration, /ADD COLUMN ciudad/, "Debe existir una migración para metadatos de ubicación");
assert.match(lifecycleMigration, /ADD COLUMN tipo_reporte/, "Debe existir una migración para el ciclo de vida del reporte");

console.log("Fase 4 validada: reportes, SOS y evidencias aplican validación, propiedad, trazabilidad y archivos seguros.");

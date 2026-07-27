import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import reportService from "../dist/services/report.service.js";
import evidenceService from "../dist/services/evidencia.service.js";
import pool from "../dist/config/database.js";
import { evidenceUploadsDir, hasValidEvidenceSignature } from "../dist/config/evidenceUpload.js";

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const student = { id_usuario: 14, rol: "ESTUDIANTE" };
const otherStudent = { id_usuario: 1, rol: "ESTUDIANTE" };
const adminId = 6;
const createdReportIds = [];
const createdFiles = [];

try {
    const report = await reportService.create({
        descripcion: "Prueba integrada temporal de la fase 4",
        nivel_riesgo: "MEDIO",
        id_ubicacion: 1
    }, student.id_usuario);
    createdReportIds.push(report.id_reporte);
    assert.equal(report.id_usuario, student.id_usuario);
    assert.equal(report.estado, "PENDIENTE");

    const filename = `evidencia-test-${crypto.randomUUID()}.png`;
    const destination = path.join(evidenceUploadsDir, filename);
    await fs.copyFile(path.join(backendDir, "screenshots", "401-no-token.png"), destination);
    createdFiles.push(destination);
    assert.equal(await hasValidEvidenceSignature(destination, "image/png"), true);

    const evidence = await evidenceService.create(report.id_reporte, {
        fieldname: "archivo",
        originalname: "401-no-token.png",
        encoding: "7bit",
        mimetype: "image/png",
        destination: evidenceUploadsDir,
        filename,
        path: destination,
        size: (await fs.stat(destination)).size,
        stream: undefined,
        buffer: undefined
    }, student);
    assert.equal(evidence.id_reporte, report.id_reporte);
    await evidenceService.delete(evidence.id_evidencia, student);
    assert.rejects(() => fs.access(destination));

    const cancellableSos = await reportService.createSOS({
        descripcion: "SOS temporal para probar propiedad y cancelación",
        id_ubicacion: 1
    }, student.id_usuario);
    createdReportIds.push(cancellableSos.id_reporte);
    await assert.rejects(
        reportService.cancelSOS(cancellableSos.id_reporte, otherStudent),
        /otro usuario/
    );
    await reportService.cancelSOS(cancellableSos.id_reporte, student);
    assert.equal((await reportService.findById(cancellableSos.id_reporte)).estado, "CANCELADO");

    const resolvableSos = await reportService.createSOS({
        descripcion: "SOS temporal para probar atención administrativa",
        id_ubicacion: 1
    }, student.id_usuario);
    createdReportIds.push(resolvableSos.id_reporte);
    await reportService.resolveSOS(resolvableSos.id_reporte, adminId);
    const resolved = await reportService.findById(resolvableSos.id_reporte);
    assert.equal(resolved.estado, "VALIDADO");
    assert.equal(resolved.id_administrador, 1);

    console.log("Integración fase 4 correcta: reporte, evidencia, propiedad SOS, cancelación y atención verificadas.");
} finally {
    if (createdReportIds.length > 0) {
        await pool.query("DELETE FROM reporte WHERE id_reporte IN (?)", [createdReportIds]);
    }
    for (const file of createdFiles) {
        await fs.unlink(file).catch(() => undefined);
    }
    await pool.end();
}

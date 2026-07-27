import "dotenv/config";
import assert from "node:assert/strict";
import routeService from "../dist/services/route.service.js";
import pool from "../dist/config/database.js";

let routeId;
const initialPoints = [
    { latitud: -3.9741, longitud: -79.2031, tipo: "INICIO" },
    { latitud: -3.9739, longitud: -79.2029, tipo: "CRUCE", observacion: "Cruce de prueba" },
    { latitud: -3.9742, longitud: -79.2032, tipo: "DESTINO" }
];

try {
    const created = await routeService.create({
        nombre_ruta: "PRUEBA INTEGRACION GEOMETRIA",
        descripcion: "Registro temporal y reversible",
        nivel_seguridad: "ALTO",
        tiempo_estimado: 4,
        ubicaciones: [1, 2],
        puntos: initialPoints
    });
    routeId = created.id_ruta;
    assert.equal(created.trazado.length, 3);
    assert.equal(created.trazado[0].tipo, "INICIO");
    assert.equal(created.trazado[2].tipo, "DESTINO");

    const traced = await routeService.trazarRuta(-3.9741, -79.2031, 2);
    assert.equal(traced.id_ruta, routeId);
    assert.equal(traced.trazado_manual, true);
    assert.equal(traced.coordenadas.length, 3);

    await routeService.update(routeId, { puntos: [...initialPoints, { latitud: -3.97425, longitud: -79.20325, tipo: "DESTINO" }] });
    const updated = await routeService.findById(routeId);
    assert.equal(updated.trazado.length, 4);
    assert.equal(updated.trazado[3].tipo, "DESTINO");

    console.log("IntegraciÃ³n de rutas correcta: crear, persistir, trazar y reemplazar geometrÃ­a verificados.");
} finally {
    if (routeId) await routeService.delete(routeId);
    await pool.end();
}

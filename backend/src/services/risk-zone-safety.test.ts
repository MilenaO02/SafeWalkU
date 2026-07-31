import assert from 'node:assert/strict';
import test from 'node:test';
import riskZoneSafetyService from './risk-zone-safety.service.js';

const zone = {
    id_zona: 1,
    nombre: 'Sector de prueba',
    nivel_riesgo: 'ALTO' as const,
    tipo_riesgo: 'POCA_ILUMINACION',
    radio_proximidad_metros: 50,
    min_lat: -4.001,
    max_lat: -3.999,
    min_lng: -79.201,
    max_lng: -79.199,
    polygon_json: [
        { lat: -4.001, lng: -79.201 },
        { lat: -4.001, lng: -79.199 },
        { lat: -3.999, lng: -79.199 },
        { lat: -3.999, lng: -79.201 }
    ]
};

test('detecta una ruta que atraviesa una zona activa', () => {
    const hits = riskZoneSafetyService.evaluate([
        [-4.000, -79.203],
        [-4.000, -79.198]
    ], [zone]);
    assert.equal(hits.length, 1);
    assert.equal(hits[0].crosses, true);
    assert.ok(hits[0].insideMeters > 0);
});

test('detecta una ruta cercana sin afirmar que atraviesa la zona', () => {
    const hits = riskZoneSafetyService.evaluate([
        [-4.00135, -79.201],
        [-4.00135, -79.199]
    ], [zone]);
    assert.equal(hits.length, 1);
    assert.equal(hits[0].crosses, false);
    assert.ok(hits[0].nearbyMeters > 0);
});

test('no genera advertencia para una ruta fuera del radio de riesgo', () => {
    const hits = riskZoneSafetyService.evaluate([
        [-4.004, -79.204],
        [-4.004, -79.203]
    ], [zone]);
    assert.equal(hits.length, 0);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { selectRouteAlternatives } from './route-selection.js';

test('la ruta más rápida conserva la menor duración real de Google Routes', () => {
    const result = selectRouteAlternatives([
        { label: 'RUTA_A', duration_min: 14, distance_m: 850, safety: { score: 94, crossed_risk_zones: 0 } },
        { label: 'RUTA_B', duration_min: 9, distance_m: 790, safety: { score: 65, crossed_risk_zones: 2 } },
        { label: 'RUTA_C', duration_min: 12, distance_m: 810, safety: { score: 70, crossed_risk_zones: 1 } }
    ]);

    assert.equal(result.fastest.duration_min, 9);
    assert.ok(result.fastest.duration_min <= 14);
    assert.ok(result.fastest.duration_min <= 12);
    assert.equal(result.recommended.label, 'RECOMENDADA');
    assert.equal(result.fastest.label, 'MAS_RAPIDA');
});

test('desempata por segundos reales aunque los minutos redondeados coincidan', () => {
    const result = selectRouteAlternatives([
        { label: 'RUTA_A', duration_min: 10, duration_seconds: 599, distance_m: 780, safety: { score: 96, crossed_risk_zones: 0 } },
        { label: 'RUTA_B', duration_min: 10, duration_seconds: 541, distance_m: 805, safety: { score: 70, crossed_risk_zones: 1 } }
    ]);

    assert.equal(result.fastest.duration_seconds, 541);
    assert.equal(result.fastest.label, 'MAS_RAPIDA');
    assert.equal(result.recommended.label, 'RECOMENDADA');
});

test('no duplica una alternativa cuando recomendada y más rápida coinciden', () => {
    const result = selectRouteAlternatives([
        { label: 'RUTA_A', duration_min: 8, distance_m: 620, safety: { score: 96, crossed_risk_zones: 0 } },
        { label: 'RUTA_B', duration_min: 11, distance_m: 720, safety: { score: 70, crossed_risk_zones: 1 } }
    ]);

    assert.equal(result.alternatives.length, 1);
    assert.equal(result.recommended.label, 'RECOMENDADA_MAS_RAPIDA');
    assert.equal(result.comparison.fastest_is_recommended, true);
});

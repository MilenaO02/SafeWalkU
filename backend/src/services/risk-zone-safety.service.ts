import { Coordinate, SafetyEvaluationResult } from './route-safety.service.js';
import { RiskPoint } from '../repositories/risk-zone.repository.js';
import { riskScoringConfig, RiskLevel } from '../config/risk-scoring.config.js';

type PolygonRiskZone = { id_zona: number; nombre: string; nivel_riesgo: RiskLevel; polygon_json: RiskPoint[]; radio_proximidad_metros: number; min_lat: number; max_lat: number; min_lng: number; max_lng: number };
const earthRadius = 6371000;
const toRadians = (value: number) => value * Math.PI / 180;
function distance(a: RiskPoint, b: RiskPoint) {
    const dLat = toRadians(b.lat - a.lat), dLng = toRadians(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(dLng / 2) ** 2;
    return earthRadius * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
function pointInPolygon(point: RiskPoint, polygon: RiskPoint[]) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const current = polygon[i], previous = polygon[j];
        const crosses = ((current.lat > point.lat) !== (previous.lat > point.lat)) && point.lng < ((previous.lng - current.lng) * (point.lat - current.lat)) / (previous.lat - current.lat) + current.lng;
        if (crosses) inside = !inside;
    }
    return inside;
}
function pointToSegmentMeters(point: RiskPoint, start: RiskPoint, end: RiskPoint) {
    // Local equirectangular projection is adequate for the short urban segments
    // returned by Google Routes and avoids treating a curved route as a line.
    const scaleX = 111320 * Math.cos(toRadians((start.lat + end.lat + point.lat) / 3));
    const scaleY = 110540;
    const px = point.lng * scaleX, py = point.lat * scaleY, ax = start.lng * scaleX, ay = start.lat * scaleY, bx = end.lng * scaleX, by = end.lat * scaleY;
    const dx = bx - ax, dy = by - ay, length = dx * dx + dy * dy;
    const t = length === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / length));
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
function candidate(zone: PolygonRiskZone, route: Coordinate[]) {
    return route.some(([lat, lng]) => lat >= Number(zone.min_lat) - 0.01 && lat <= Number(zone.max_lat) + 0.01 && lng >= Number(zone.min_lng) - 0.01 && lng <= Number(zone.max_lng) + 0.01);
}

class RiskZoneSafetyService {
    evaluate(route: Coordinate[], zones: PolygonRiskZone[]) {
        const crossed: Array<{ zone: PolygonRiskZone; insideMeters: number }> = [];
        for (const zone of zones) {
            if (!Array.isArray(zone.polygon_json) || zone.polygon_json.length < 3 || !candidate(zone, route)) continue;
            let crossedZone = false, insideMeters = 0;
            for (let index = 0; index < route.length; index += 1) {
                const point = { lat: Number(route[index][0]), lng: Number(route[index][1]) };
                if (pointInPolygon(point, zone.polygon_json)) crossedZone = true;
                if (index > 0) {
                    const previous = { lat: Number(route[index - 1][0]), lng: Number(route[index - 1][1]) };
                    const segmentLength = distance(previous, point);
                    const midpoint = { lat: (previous.lat + point.lat) / 2, lng: (previous.lng + point.lng) / 2 };
                    if (pointInPolygon(midpoint, zone.polygon_json) || pointInPolygon(previous, zone.polygon_json) || pointInPolygon(point, zone.polygon_json)) { crossedZone = true; insideMeters += segmentLength; }
                    else if (zone.polygon_json.some(vertex => pointToSegmentMeters(vertex, previous, point) <= Number(zone.radio_proximidad_metros))) crossedZone = true;
                }
            }
            if (crossedZone) crossed.push({ zone, insideMeters: Math.round(insideMeters) });
        }
        return crossed;
    }
    merge(base: SafetyEvaluationResult, route: Coordinate[], zones: PolygonRiskZone[]): SafetyEvaluationResult & { polygon_risks: unknown[] } {
        const crossed = this.evaluate(route, zones);
        const penalty = crossed.reduce((total, item) => total + riskScoringConfig.polygonPenalty[item.zone.nivel_riesgo], 0);
        const score = Math.max(0, base.score - penalty);
        const classification = score >= 75 ? 'SEGURA' : score >= 45 ? 'PRECAUCION' : 'NO_RECOMENDADA';
        const risk_level = classification === 'SEGURA' ? 'BAJO' : classification === 'PRECAUCION' ? 'MEDIO' : 'ALTO';
        const reasons = crossed.length ? [...base.reasons, ...crossed.map(item => `[Zona de riesgo] ${item.zone.nombre}: nivel ${item.zone.nivel_riesgo}${item.insideMeters ? ` (${item.insideMeters} m dentro del poligono)` : ' (cerca del poligono)'}.`)] : base.reasons;
        return { ...base, score, classification, risk_level, crossed_risk_zones: base.crossed_risk_zones + crossed.length, reasons, polygon_risks: crossed.map(item => ({ id_zona: item.zone.id_zona, nombre: item.zone.nombre, nivel_riesgo: item.zone.nivel_riesgo, longitud_dentro_metros: item.insideMeters })) };
    }
}
export default new RiskZoneSafetyService();

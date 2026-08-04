import { Coordinate, SafetyEvaluationResult } from './route-safety.service.js';
import { RiskPoint } from '../repositories/risk-zone.repository.js';
import { riskScoringConfig, RiskLevel } from '../config/risk-scoring.config.js';

type PolygonRiskZone = {
    id_zona: number;
    nombre: string;
    nivel_riesgo: RiskLevel;
    tipo_riesgo?: string;
    polygon_json: RiskPoint[];
    radio_proximidad_metros: number;
    min_lat: number;
    max_lat: number;
    min_lng: number;
    max_lng: number;
};

type ZoneHit = {
    zone: PolygonRiskZone;
    crosses: boolean;
    insideMeters: number;
    nearbyMeters: number;
    closestMeters: number;
};

const earthRadius = 6_371_000;
const toRadians = (value: number) => (value * Math.PI) / 180;

function distance(a: RiskPoint, b: RiskPoint) {
    const dLat = toRadians(b.lat - a.lat);
    const dLng = toRadians(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(dLng / 2) ** 2;
    return earthRadius * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function pointInPolygon(point: RiskPoint, polygon: RiskPoint[]) {
    let inside = false;
    for (let index = 0, previousIndex = polygon.length - 1; index < polygon.length; previousIndex = index++) {
        const current = polygon[index];
        const previous = polygon[previousIndex];
        const crosses = ((current.lat > point.lat) !== (previous.lat > point.lat))
            && point.lng < ((previous.lng - current.lng) * (point.lat - current.lat)) / (previous.lat - current.lat) + current.lng;
        if (crosses) inside = !inside;
    }
    return inside;
}

function project(point: RiskPoint, latitudeReference: number) {
    return {
        x: point.lng * 111_320 * Math.cos(toRadians(latitudeReference)),
        y: point.lat * 110_540
    };
}

function orientation(a: RiskPoint, b: RiskPoint, c: RiskPoint) {
    const value = (b.lng - a.lng) * (c.lat - a.lat) - (b.lat - a.lat) * (c.lng - a.lng);
    if (Math.abs(value) < 1e-12) return 0;
    return value > 0 ? 1 : -1;
}

function onSegment(a: RiskPoint, b: RiskPoint, point: RiskPoint) {
    return point.lat >= Math.min(a.lat, b.lat) - 1e-12
        && point.lat <= Math.max(a.lat, b.lat) + 1e-12
        && point.lng >= Math.min(a.lng, b.lng) - 1e-12
        && point.lng <= Math.max(a.lng, b.lng) + 1e-12;
}

function segmentsIntersect(a: RiskPoint, b: RiskPoint, c: RiskPoint, d: RiskPoint) {
    const first = orientation(a, b, c);
    const second = orientation(a, b, d);
    const third = orientation(c, d, a);
    const fourth = orientation(c, d, b);
    if (first !== second && third !== fourth) return true;
    return (first === 0 && onSegment(a, b, c))
        || (second === 0 && onSegment(a, b, d))
        || (third === 0 && onSegment(c, d, a))
        || (fourth === 0 && onSegment(c, d, b));
}

function pointToSegmentMeters(point: RiskPoint, start: RiskPoint, end: RiskPoint) {
    const latitudeReference = (point.lat + start.lat + end.lat) / 3;
    const p = project(point, latitudeReference);
    const a = project(start, latitudeReference);
    const b = project(end, latitudeReference);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = dx * dx + dy * dy;
    const t = length === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / length));
    return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

function segmentToSegmentMeters(a: RiskPoint, b: RiskPoint, c: RiskPoint, d: RiskPoint) {
    if (segmentsIntersect(a, b, c, d)) return 0;
    return Math.min(
        pointToSegmentMeters(a, c, d),
        pointToSegmentMeters(b, c, d),
        pointToSegmentMeters(c, a, b),
        pointToSegmentMeters(d, a, b)
    );
}

function zoneEdges(zone: PolygonRiskZone) {
    return zone.polygon_json.map((point, index) => [point, zone.polygon_json[(index + 1) % zone.polygon_json.length]] as const);
}

class RiskZoneSafetyService {
    evaluate(route: Coordinate[], zones: PolygonRiskZone[]): ZoneHit[] {
        const hits: ZoneHit[] = [];
        if (route.length < 2) return hits;

        for (const zone of zones) {
            if (!Array.isArray(zone.polygon_json) || zone.polygon_json.length < 3) continue;
            let crosses = false;
            let insideMeters = 0;
            let nearbyMeters = 0;
            let closestMeters = Number.POSITIVE_INFINITY;
            const proximityRadius = Math.max(0, Number(zone.radio_proximidad_metros) || 0);
            const edges = zoneEdges(zone);

            for (let index = 1; index < route.length; index += 1) {
                const previous = { lat: Number(route[index - 1][0]), lng: Number(route[index - 1][1]) };
                const current = { lat: Number(route[index][0]), lng: Number(route[index][1]) };
                const midpoint = { lat: (previous.lat + current.lat) / 2, lng: (previous.lng + current.lng) / 2 };
                const segmentLength = distance(previous, current);
                const intersectsBoundary = edges.some(([start, end]) => segmentsIntersect(previous, current, start, end));
                const inside = pointInPolygon(previous, zone.polygon_json)
                    || pointInPolygon(midpoint, zone.polygon_json)
                    || pointInPolygon(current, zone.polygon_json)
                    || intersectsBoundary;
                const segmentDistance = Math.min(...edges.map(([start, end]) => segmentToSegmentMeters(previous, current, start, end)));
                closestMeters = Math.min(closestMeters, segmentDistance);

                if (inside) {
                    crosses = true;
                    insideMeters += segmentLength;
                } else if (segmentDistance <= proximityRadius) {
                    nearbyMeters += segmentLength;
                }
            }

            if (crosses || nearbyMeters > 0) {
                hits.push({
                    zone,
                    crosses,
                    insideMeters: Math.round(insideMeters),
                    nearbyMeters: Math.round(nearbyMeters),
                    closestMeters: Math.round(closestMeters)
                });
            }
        }
        return hits;
    }

    merge(base: SafetyEvaluationResult, route: Coordinate[], zones: PolygonRiskZone[]): SafetyEvaluationResult & { blocked_by_risk_zone: boolean; polygon_risks: unknown[] } {
        const hits = this.evaluate(route, zones);
        const crossingHits = hits.filter((item) => item.crosses);
        const penalty = hits.reduce((total, item) => total + riskScoringConfig.polygonPenalty[item.zone.nivel_riesgo], 0);
        const score = crossingHits.length ? 0 : Math.max(0, base.score - penalty);
        const classification = crossingHits.length ? 'NO_RECOMENDADA' : score >= 75 ? 'SEGURA' : score >= 45 ? 'PRECAUCION' : 'NO_RECOMENDADA';
        const risk_level = classification === 'SEGURA' ? 'BAJO' : classification === 'PRECAUCION' ? 'MEDIO' : 'ALTO';
        const reasons = hits.length
            ? [...base.reasons, ...hits.map((item) => {
                const level = item.zone.nivel_riesgo.toLowerCase();
                if (item.crosses) {
                    return `Zona de riesgo: ${item.zone.nombre}. Nivel ${level}. El recorrido atraviesa este sector durante aproximadamente ${item.insideMeters} m.`;
                }
                return `Zona de riesgo: ${item.zone.nombre}. Nivel ${level}. La ruta pasa cerca de este sector, a aproximadamente ${item.closestMeters} m.`;
            })]
            : base.reasons;
        return {
            ...base,
            score,
            classification,
            risk_level,
            crossed_risk_zones: base.crossed_risk_zones + hits.length,
            reasons,
            blocked_by_risk_zone: crossingHits.length > 0,
            polygon_risks: hits.map((item) => ({
                id_zona: item.zone.id_zona,
                nombre: item.zone.nombre,
                nivel_riesgo: item.zone.nivel_riesgo,
                tipo_riesgo: item.zone.tipo_riesgo,
                atraviesa: item.crosses,
                longitud_dentro_metros: item.insideMeters,
                longitud_cercana_metros: item.nearbyMeters,
                distancia_minima_metros: item.closestMeters
            }))
        };
    }
}

export default new RiskZoneSafetyService();

export type Coordinate = [number, number];

export interface IncidentReport {
    id_reporte: number;
    descripcion: string;
    nivel_riesgo: "BAJO" | "MEDIO" | "ALTO";
    fecha_reporte: Date | string;
    latitud: number;
    longitud: number;
}

export interface RiskZone {
    id_reporte?: number;
    id_ubicacion?: number;
    ubicacion_nombre?: string;
    nivel_riesgo: "BAJO" | "MEDIO" | "ALTO";
    radio_metros: number;
    latitud: number;
    longitud: number;
}

export interface SafetyEvaluationResult {
    classification: "SEGURA" | "PRECAUCIÓN" | "NO_RECOMENDADA";
    score: number;
    risk_level: "BAJO" | "MEDIO" | "ALTO";
    nearby_reports: number;
    crossed_risk_zones: number;
    reasons: string[];
    warning: string;
}

function haversineDistanceMeters(coord1: Coordinate, coord2: Coordinate): number {
    const toRad = (angle: number) => (angle * Math.PI) / 180;
    const earthRadius = 6371000;
    const dLat = toRad(coord2[0] - coord1[0]);
    const dLng = toRad(coord2[1] - coord1[1]);
    const lat1 = toRad(coord1[0]);
    const lat2 = toRad(coord2[0]);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadius * c;
}

function minDistanceToRoute(point: Coordinate, routeCoordinates: Coordinate[]): number {
    if (routeCoordinates.length === 0) return Infinity;
    let minDistance = Infinity;
    for (const routePoint of routeCoordinates) {
        const dist = haversineDistanceMeters(point, routePoint);
        if (dist < minDistance) {
            minDistance = dist;
        }
    }
    return minDistance;
}

class SafetyAnalysisService {
    evaluate(
        routeCoordinates: Coordinate[],
        reports: IncidentReport[],
        riskZones: RiskZone[]
    ): SafetyEvaluationResult {
        if (!routeCoordinates || routeCoordinates.length === 0) {
            return {
                classification: "PRECAUCIÓN",
                score: 50,
                risk_level: "MEDIO",
                nearby_reports: 0,
                crossed_risk_zones: 0,
                reasons: ["No se dispuso de trazado detallado para calcular la seguridad."],
                warning: "Esta recomendación se basa en datos disponibles. Mantente alerta a las condiciones del entorno."
            };
        }

        let score = 100;
        const reasons: string[] = [];
        const THRESHOLD_NEARBY_METERS = 150;
        const now = new Date().getTime();

        const processedReports = new Set<number>();
        let nearbyReportCount = 0;
        let highRiskReports = 0;
        let mediumRiskReports = 0;
        let lowRiskReports = 0;

        for (const report of reports) {
            if (processedReports.has(report.id_reporte)) continue;

            const reportCoord: Coordinate = [Number(report.latitud), Number(report.longitud)];
            if (!Number.isFinite(reportCoord[0]) || !Number.isFinite(reportCoord[1])) continue;

            const dist = minDistanceToRoute(reportCoord, routeCoordinates);

            if (dist <= THRESHOLD_NEARBY_METERS) {
                processedReports.add(report.id_reporte);
                nearbyReportCount++;

                const reportDate = new Date(report.fecha_reporte).getTime();
                const daysDiff = Math.max(0, (now - reportDate) / (1000 * 3600 * 24));
                const recencyFactor = daysDiff > 30 ? 0.5 : 1.0;

                if (report.nivel_riesgo === "ALTO") {
                    highRiskReports++;
                    score -= 25 * recencyFactor;
                } else if (report.nivel_riesgo === "MEDIO") {
                    mediumRiskReports++;
                    score -= 12 * recencyFactor;
                } else {
                    lowRiskReports++;
                    score -= 5 * recencyFactor;
                }
            }
        }

        const processedZones = new Set<string>();
        let crossedRiskZoneCount = 0;
        let highRiskZones = 0;
        let mediumRiskZones = 0;

        for (let i = 0; i < riskZones.length; i++) {
            const zone = riskZones[i];
            const zoneKey = `${zone.id_reporte || zone.id_ubicacion || i}_${zone.latitud}_${zone.longitud}`;
            if (processedZones.has(zoneKey)) continue;

            const zoneCoord: Coordinate = [Number(zone.latitud), Number(zone.longitud)];
            if (!Number.isFinite(zoneCoord[0]) || !Number.isFinite(zoneCoord[1])) continue;

            const dist = minDistanceToRoute(zoneCoord, routeCoordinates);
            const effectiveRadius = Math.max(Number(zone.radio_metros) || 80, 50);

            if (dist <= effectiveRadius + 30) {
                processedZones.add(zoneKey);
                crossedRiskZoneCount++;

                if (zone.nivel_riesgo === "ALTO") {
                    highRiskZones++;
                    score -= 30;
                } else if (zone.nivel_riesgo === "MEDIO") {
                    mediumRiskZones++;
                    score -= 15;
                } else {
                    score -= 5;
                }
            }
        }

        score = Math.max(0, Math.min(100, Math.round(score)));

        let classification: "SEGURA" | "PRECAUCIÓN" | "NO_RECOMENDADA";
        let risk_level: "BAJO" | "MEDIO" | "ALTO";

        if (score >= 75) {
            classification = "SEGURA";
            risk_level = "BAJO";
        } else if (score >= 45) {
            classification = "PRECAUCIÓN";
            risk_level = "MEDIO";
        } else {
            classification = "NO_RECOMENDADA";
            risk_level = "ALTO";
        }

        if (highRiskZones > 0) {
            reasons.push(`Atraviesa o bordea ${highRiskZones} zona(s) de riesgo ALTO activas.`);
        }
        if (mediumRiskZones > 0) {
            reasons.push(`Pasa cerca de ${mediumRiskZones} zona(s) de riesgo MEDIO.`);
        }
        if (highRiskReports > 0) {
            reasons.push(`Registra ${highRiskReports} reporte(s) cercano(s) de nivel de riesgo ALTO.`);
        }
        if (mediumRiskReports > 0) {
            reasons.push(`Registra ${mediumRiskReports} reporte(s) cercano(s) de nivel de riesgo MEDIO.`);
        }
        if (lowRiskReports > 0 && highRiskReports === 0 && mediumRiskReports === 0) {
            reasons.push(`Registra ${lowRiskReports} reporte(s) menor(es) en las cercanías.`);
        }

        if (reasons.length === 0) {
            reasons.push("No se registraron incidentes recientes ni zonas de riesgo en el trayecto.");
            reasons.push("La mayoría del recorrido transcurre libre de alertas activas.");
        }

        const warning =
            "Esta recomendación se basa en reportes ciudadanos y datos registrados en la plataforma. Mantente alerta a las condiciones reales del entorno.";

        return {
            classification,
            score,
            risk_level,
            nearby_reports: nearbyReportCount,
            crossed_risk_zones: crossedRiskZoneCount,
            reasons,
            warning
        };
    }
}

export default new SafetyAnalysisService();

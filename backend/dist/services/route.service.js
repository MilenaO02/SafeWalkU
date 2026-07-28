import routeRepository from "../repositories/route.repository.js";
import reportRepository from "../repositories/report.repository.js";
import googleRoutesService from "./google-routes.service.js";
import safetyAnalysisService from "./safety-analysis.service.js";
// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────
/** Haversine distance in metres between two [lat, lng] pairs. */
function straightLineMeters(a, b) {
    const R = 6371000;
    const r = (d) => (d * Math.PI) / 180;
    const dLat = r(b[0] - a[0]);
    const dLng = r(b[1] - a[1]);
    const h = Math.sin(dLat / 2) ** 2 +
        Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
}
/** Walking minutes at ~80 m/min (comfortable urban pace). */
function walkingMinutes(distanceM) {
    return Math.max(1, Math.ceil(distanceM / 80));
}
/** Load active incident reports and risk zones from the DB (best-effort). */
async function loadSafetyData(city) {
    try {
        const rawReports = await reportRepository.findActiveReportsByCity(city);
        const reports = rawReports.map((r) => ({
            id_reporte: Number(r.id_reporte),
            descripcion: String(r.descripcion ?? ""),
            nivel_riesgo: r.nivel_riesgo,
            fecha_reporte: r.fecha_reporte,
            latitud: Number(r.latitud),
            longitud: Number(r.longitud),
        }));
        const rawZones = await reportRepository.findRiskZonesByCity(city);
        const zones = rawZones.map((z) => ({
            id_reporte: Number(z.id_reporte),
            ubicacion_nombre: String(z.ubicacion_nombre ?? ""),
            nivel_riesgo: z.nivel_riesgo,
            radio_metros: Number(z.radio_metros) || 80,
            latitud: Number(z.latitud),
            longitud: Number(z.longitud),
        }));
        return { reports, zones };
    }
    catch (err) {
        console.warn("[RouteService] No fue posible cargar datos de seguridad:", err instanceof Error ? err.message : err);
        return { reports: [], zones: [] };
    }
}
// ─────────────────────────────────────────────────────────────────────────────
// RouteService
// ─────────────────────────────────────────────────────────────────────────────
class RouteService {
    // ── CRUD ─────────────────────────────────────────────────────────────────
    findAll() {
        return routeRepository.findAll();
    }
    async findById(id) {
        if (!Number.isInteger(id) || id < 1)
            throw new Error("ID de ruta inválido");
        const route = await routeRepository.findById(id);
        if (!route)
            throw new Error("Ruta no encontrada");
        return route;
    }
    async create(data) {
        const id = await routeRepository.create(data);
        return this.findById(id);
    }
    async update(id, data) {
        await this.findById(id);
        await routeRepository.update(id, data);
        return this.findById(id);
    }
    async delete(id) {
        await this.findById(id);
        await routeRepository.delete(id);
        return { success: true, message: "Ruta eliminada correctamente" };
    }
    // ── Pedestrian route tracing ──────────────────────────────────────────────
    /**
     * trazarRuta
     *
     * Two mutually-exclusive calling modalities:
     *
     *   Modalidad 1 — registered destination (destino_id supplied)
     *     • Looks up the destination in MySQL to get name / coords.
     *     • Tries to find a catalogued route ending there.
     *
     *   Modalidad 2 — external destination (externalDestination supplied)
     *     • Uses the coordinates supplied directly — no DB lookup required.
     *     • id_ruta = null, ruta_catalogada = false always.
     *     • nombre_ruta = externalDestination.nombre or "Ruta peatonal".
     *
     * In BOTH modalities:
     *   1. Calls Google Routes API for a real pedestrian path (travelMode: WALK).
     *   2. Devolves fuente_trazado: "GOOGLE_ROUTES" when Google responds.
     *   3. Falls back to "REFERENCIAL" ONLY when Google Routes genuinely fails.
     */
    async trazarRuta(originLat, originLng, destinationId, externalDestination) {
        const origin = [originLat, originLng];
        // ── Resolve destination ─────────────────────────────────────────────
        let destPoint;
        let destName;
        let destAddress;
        let recommended = null;
        if (destinationId) {
            // Modalidad 1 — registered destination
            const dbDest = await routeRepository.findDestination(destinationId);
            if (!dbDest)
                throw new Error("Destino no encontrado");
            destPoint = [Number(dbDest.latitud), Number(dbDest.longitud)];
            destName = String(dbDest.nombre ?? "Destino");
            destAddress = String(dbDest.direccion ?? "Loja, Ecuador");
            try {
                recommended = (await routeRepository.findRecommendedByDestination(destinationId)) ?? null;
            }
            catch {
                recommended = null;
            }
        }
        else if (externalDestination) {
            // Modalidad 2 — external / Google Places destination
            destPoint = [externalDestination.lat, externalDestination.lng];
            destName = externalDestination.nombre?.trim() || "Ruta peatonal";
            destAddress = externalDestination.direccion?.trim() || "Loja, Ecuador";
            recommended = null;
        }
        else {
            throw new Error("Destino no encontrado");
        }
        // ── Load safety data (best-effort, does not block routing) ──────────
        const { reports: activeReports, zones: riskZones } = await loadSafetyData("Loja");
        // ── Call Google Routes API (travelMode WALK) ────────────────────────
        const googleRoute = await googleRoutesService.calculate(origin, destPoint);
        if (googleRoute && googleRoute.coordinates.length >= 2) {
            // ── Happy path: real pedestrian route from Google Routes ───────────
            const safety = safetyAnalysisService.evaluate(googleRoute.coordinates, activeReports, riskZones);
            const safetyLevel = safety.classification === "SEGURA"
                ? "BAJO"
                : safety.classification === "PRECAUCIÓN"
                    ? "MEDIO"
                    : "ALTO";
            return {
                // Modern response fields
                route_id: recommended?.id_ruta ?? null,
                source: "GOOGLE_ROUTES",
                travel_mode: "WALK",
                origin: { lat: originLat, lng: originLng },
                destination: {
                    location_id: destinationId ?? null,
                    place_id: externalDestination?.place_id ?? null,
                    name: destName,
                    address: destAddress,
                    lat: destPoint[0],
                    lng: destPoint[1],
                },
                distance_m: googleRoute.distanceMeters,
                duration_min: googleRoute.durationMinutes,
                encoded_polyline: googleRoute.encodedPolyline,
                coordinates: googleRoute.coordinates,
                steps: googleRoute.instructions,
                safety,
                // Legacy compatibility fields
                id_ruta: destinationId ? (recommended?.id_ruta ?? null) : null,
                nombre_ruta: destinationId ? (recommended?.nombre_ruta ?? destName) : (externalDestination?.nombre?.trim() || "Ruta peatonal"),
                nivel_seguridad: destinationId ? (recommended?.nivel_seguridad ?? safetyLevel) : safetyLevel,
                tiempo_estimado: googleRoute.durationMinutes,
                distancia_m: googleRoute.distanceMeters,
                ruta_catalogada: destinationId ? Boolean(recommended) : false,
                trazado_manual: false,
                trazado_peatonal: true,
                fuente_trazado: "GOOGLE_ROUTES",
                instrucciones: googleRoute.instructions,
                origen_usuario: origin,
                coordenadas: googleRoute.coordinates,
                aviso: "Trayecto peatonal calculado con Google Routes. Las condiciones de seguridad se evalúan con los datos del sistema.",
            };
        }
        // ── Fallback: straight-line referencial (only when Google fails) ────
        console.warn("[RouteService] Google Routes no devolvió un trazado válido. " +
            "Usando trayecto referencial directo de respaldo.");
        const fallbackCoords = [origin, destPoint];
        const fallbackDist = Math.round(straightLineMeters(origin, destPoint));
        const fallbackDur = walkingMinutes(fallbackDist);
        const fallbackSafety = safetyAnalysisService.evaluate(fallbackCoords, activeReports, riskZones);
        const fallbackSafetyLevel = fallbackSafety.classification === "SEGURA"
            ? "BAJO"
            : fallbackSafety.classification === "PRECAUCIÓN"
                ? "MEDIO"
                : "ALTO";
        return {
            // Modern response fields
            route_id: recommended?.id_ruta ?? null,
            source: "REFERENCIAL",
            travel_mode: "WALK",
            origin: { lat: originLat, lng: originLng },
            destination: {
                location_id: destinationId ?? null,
                place_id: externalDestination?.place_id ?? null,
                name: destName,
                address: destAddress,
                lat: destPoint[0],
                lng: destPoint[1],
            },
            distance_m: fallbackDist,
            duration_min: fallbackDur,
            encoded_polyline: "",
            coordinates: fallbackCoords,
            steps: [
                {
                    instruction: `Dirígete en línea recta hacia ${destName}`,
                    distance_m: fallbackDist,
                    duration_min: fallbackDur,
                },
            ],
            safety: fallbackSafety,
            // Legacy compatibility fields
            id_ruta: destinationId ? (recommended?.id_ruta ?? null) : null,
            nombre_ruta: destinationId ? (recommended?.nombre_ruta ?? destName) : (externalDestination?.nombre?.trim() || "Ruta peatonal"),
            nivel_seguridad: destinationId ? (recommended?.nivel_seguridad ?? fallbackSafetyLevel) : fallbackSafetyLevel,
            tiempo_estimado: fallbackDur,
            distancia_m: fallbackDist,
            ruta_catalogada: destinationId ? Boolean(recommended) : false,
            trazado_manual: false,
            trazado_peatonal: false,
            fuente_trazado: "REFERENCIAL",
            instrucciones: [
                {
                    instruction: `Dirígete en línea recta hacia ${destName}`,
                    distance_m: fallbackDist,
                    duration_min: fallbackDur,
                },
            ],
            origen_usuario: origin,
            coordenadas: fallbackCoords,
            aviso: "No fue posible obtener la ruta de Google Routes. Se muestra un trayecto referencial directo. " +
                "Verifica el entorno antes de caminar.",
        };
    }
}
export default new RouteService();

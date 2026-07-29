import routeRepository from "../repositories/route.repository.js";
import reportRepository from "../repositories/report.repository.js";
import pedestrianRoutingService from "./pedestrian-routing.service.js";
import routeSafetyService from "./route-safety.service.js";
import lugarRepository from "../repositories/lugar.repository.js";
import servicioRepository from "../repositories/servicio.repository.js";
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
        const rawPlaces = await lugarRepository.findAll();
        const safePlaces = rawPlaces.map((p) => ({
            id_lugar_seguro: Number(p.id_lugar_seguro),
            nombre: String(p.ubicacion_nombre || p.nombre || "Lugar Seguro"),
            latitud: Number(p.latitud),
            longitud: Number(p.longitud),
        }));
        const rawServices = await servicioRepository.findAll();
        const emergencyServices = rawServices.map((s) => ({
            id_servicio: Number(s.id_servicio),
            nombre: String(s.ubicacion_nombre || s.nombre || "Servicio Emergencia"),
            latitud: Number(s.latitud),
            longitud: Number(s.longitud),
        }));
        return { reports, zones, safePlaces, emergencyServices };
    }
    catch (err) {
        console.warn("[RouteService] No fue posible cargar datos de seguridad de MySQL:", err instanceof Error ? err.message : err);
        return { reports: [], zones: [], safePlaces: [], emergencyServices: [] };
    }
}
// ─────────────────────────────────────────────────────────────────────────────
// RouteService
// ─────────────────────────────────────────────────────────────────────────────
class RouteService {
    findAll() {
        return routeRepository.findAll();
    }
    async findById(id) {
        if (!Number.isInteger(id) || id < 1)
            throw new Error("ID de ruta invÃ¡lido");
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
     * Accepts a strongly-typed TraceRouteParams object with two modalities:
     *
     *   REGISTERED destination:
     *     - Fetches destination from MySQL database.
     *     - Obtains coordinates and catalogued route (if available).
     *
     *   EXTERNAL destination:
     *     - Does not query MySQL for location.
     *     - Uses coordinates supplied directly.
     *     - id_ruta = null, ruta_catalogada = false always.
     *     - nombre_ruta = destination.name || "Ruta peatonal".
     *
     * In BOTH cases:
     *   - Executes pedestrianRoutingService.calculate(originPoint, destPoint) with Google Routes.
     *   - On Google Routes success: fuente_trazado = "GOOGLE_ROUTES", trazado_peatonal = true.
     *   - Returns "REFERENCIAL" ONLY when Google Routes genuinely fails.
     */
    async trazarRuta(params) {
        const { origin, destination } = params;
        const originPoint = [origin.lat, origin.lng];
        // ── Resolve destination ─────────────────────────────────────────────
        let destPoint;
        let destName;
        let destAddress;
        let locationId = null;
        let placeId = null;
        let sourceTag = "GOOGLE_PLACES";
        if (destination.type === "REGISTERED") {
            const dbDest = await routeRepository.findDestination(destination.id);
            if (!dbDest)
                throw new Error("Destino no encontrado");
            destPoint = [Number(dbDest.latitud), Number(dbDest.longitud)];
            destName = String(dbDest.nombre ?? "Destino registrado");
            destAddress = String(dbDest.direccion ?? "Loja, Ecuador");
            locationId = destination.id;
            sourceTag = "BASE_DATOS";
        }
        else {
            destPoint = [destination.lat, destination.lng];
            destName = destination.name?.trim() || "Ruta peatonal";
            destAddress = destination.address?.trim() || "Loja, Ecuador";
            placeId = destination.placeId?.trim() || null;
            sourceTag = "GOOGLE_PLACES";
        }
        // ── Load active safety data ─────────────────────────────────────────
        const { reports: activeReports, zones: riskZones, safePlaces, emergencyServices } = await loadSafetyData("Loja");
        // ── Request all alternative routes from Google ───────────────────────
        const allRoutes = await pedestrianRoutingService.calculateAll(originPoint, destPoint);
        const destInfo = {
            id_ubicacion: locationId,
            place_id: placeId,
            nombre: destName,
            direccion: destAddress,
            latitud: destPoint[0],
            longitud: destPoint[1],
            fuente: sourceTag,
        };
        // ── Walking assessment thresholds ────────────────────────────────────
        const MAX_WALKING_METERS = 2000;
        const MAX_WALKING_MINUTES = 30;
        // ── Helper: find nearest safe place to a coordinate ──────────────────
        const findIntermediatePoint = (coords) => {
            if (coords.length < 4)
                return null;
            const midIdx = Math.floor(coords.length / 2);
            const midPoint = coords[midIdx];
            let best = null;
            for (const place of safePlaces) {
                const placeCoord = [Number(place.latitud), Number(place.longitud)];
                if (!Number.isFinite(placeCoord[0]) || !Number.isFinite(placeCoord[1]))
                    continue;
                const dist = straightLineMeters(midPoint, placeCoord);
                if (dist <= 500 && (!best || dist < best.dist)) {
                    best = { place, dist };
                }
            }
            // Also try emergency services
            for (const svc of emergencyServices) {
                const svcCoord = [Number(svc.latitud), Number(svc.longitud)];
                if (!Number.isFinite(svcCoord[0]) || !Number.isFinite(svcCoord[1]))
                    continue;
                const dist = straightLineMeters(midPoint, svcCoord);
                if (dist <= 500 && (!best || dist < best.dist)) {
                    best = { place: { id_lugar_seguro: svc.id_servicio, nombre: svc.nombre, latitud: svc.latitud, longitud: svc.longitud }, dist };
                }
            }
            if (!best)
                return null;
            return {
                nombre: best.place.nombre,
                latitud: best.place.latitud,
                longitud: best.place.longitud,
                distancia_desde_origen_m: Math.round(straightLineMeters(originPoint, [best.place.latitud, best.place.longitud])),
                motivo: "Punto intermedio seguro recomendado antes de continuar el recorrido.",
                fuente: "SafeWalk U (Base de datos)",
            };
        };
        // ── Build alternative objects ────────────────────────────────────────
        const buildAlternative = (route, label) => {
            const safety = routeSafetyService.evaluate(route.coordinates, activeReports, riskZones, safePlaces, emergencyServices);
            const walkingNotRecommended = route.distanceMeters > MAX_WALKING_METERS || route.durationMinutes > MAX_WALKING_MINUTES;
            const walkingAdvisory = [];
            if (walkingNotRecommended) {
                walkingAdvisory.push(`Este trayecto mide ${route.distanceMeters} m y tomaría aproximadamente ${route.durationMinutes} min a pie. No se recomienda completamente a pie por su distancia y duración.`);
                walkingAdvisory.push("Se recomienda continuar desde un punto intermedio mediante un medio de transporte disponible.");
            }
            const intermediatePoint = walkingNotRecommended || safety.classification === "NO_RECOMENDADA"
                ? findIntermediatePoint(route.coordinates)
                : null;
            return {
                label,
                travel_mode: "WALK",
                source: "GOOGLE_ROUTES",
                destino: destInfo,
                origin: { lat: origin.lat, lng: origin.lng },
                distance_m: route.distanceMeters,
                duration_min: route.durationMinutes,
                encoded_polyline: route.encodedPolyline ?? "",
                coordinates: route.coordinates,
                steps: route.instructions,
                safety,
                walking_not_recommended: walkingNotRecommended,
                walking_advisory: walkingAdvisory,
                intermediate_point: intermediatePoint,
            };
        };
        if (allRoutes.length >= 1) {
            // Evaluate all alternatives
            const evaluated = allRoutes.map((r, i) => buildAlternative(r, i === 0 ? "RUTA_A" : `RUTA_${String.fromCharCode(66 + i - 1)}`));
            // Sort: best safety score = recommended, lowest duration = fastest
            const sorted = [...evaluated].sort((a, b) => b.safety.score - a.safety.score);
            const recommended = sorted[0];
            recommended.label = "RECOMENDADA";
            let fastest = null;
            if (evaluated.length > 1) {
                const sortedByTime = [...evaluated].sort((a, b) => a.duration_min - b.duration_min);
                fastest = sortedByTime[0];
                if (fastest === recommended) {
                    fastest = sortedByTime[1] || null;
                }
                if (fastest) {
                    fastest.label = "MAS_RAPIDA";
                }
            }
            const alternatives = [recommended];
            if (fastest && fastest !== recommended) {
                alternatives.push(fastest);
            }
            const isSingleRoute = alternatives.length === 1;
            return {
                single_route: isSingleRoute,
                single_route_message: isSingleRoute
                    ? "Google Routes devolvió una única alternativa; esta es la más rápida y la mejor evaluada con los datos disponibles."
                    : null,
                alternatives,
                // Legacy compat (first route)
                ...this.legacyFields(recommended, originPoint, destName, locationId, destInfo),
            };
        }
        // ── Fallback: straight-line referencial ─────────────────────────────
        console.warn("[RouteService] Google Routes no devolvió trazados válidos. Devolviendo referencial.");
        const fallbackCoords = [originPoint, destPoint];
        const fallbackDist = Math.round(straightLineMeters(originPoint, destPoint));
        const fallbackDur = walkingMinutes(fallbackDist);
        const fallbackSafety = routeSafetyService.evaluate(fallbackCoords, activeReports, riskZones, safePlaces, emergencyServices);
        const fallbackAlt = {
            label: "RECOMENDADA",
            travel_mode: "WALK",
            source: "REFERENCIAL",
            destino: destInfo,
            origin: { lat: origin.lat, lng: origin.lng },
            distance_m: fallbackDist,
            duration_min: fallbackDur,
            encoded_polyline: "",
            coordinates: fallbackCoords,
            steps: [{ instruction: `Dirígete en línea recta hacia ${destName}`, distance_m: fallbackDist, duration_min: fallbackDur }],
            safety: fallbackSafety,
            walking_not_recommended: false,
            walking_advisory: [],
            intermediate_point: null,
        };
        return {
            single_route: true,
            single_route_message: null,
            alternatives: [fallbackAlt],
            // Legacy compat
            travel_mode: "WALK",
            destino: destInfo,
            source: "REFERENCIAL",
            origin: { lat: origin.lat, lng: origin.lng },
            distance_m: fallbackDist,
            duration_min: fallbackDur,
            encoded_polyline: "",
            coordinates: fallbackCoords,
            steps: fallbackAlt.steps,
            safety: fallbackSafety,
            nombre_ruta: destName,
            nivel_seguridad: null,
            tiempo_estimado: fallbackDur,
            distancia_m: fallbackDist,
            fuente_trazado: "REFERENCIAL",
            instrucciones: fallbackAlt.steps,
            origen_usuario: originPoint,
            coordenadas: fallbackCoords,
            aviso: "No fue posible calcular una ruta peatonal real.",
        };
    }
    /** Build legacy-compat top-level fields from the recommended alternative */
    legacyFields(alt, originPoint, destName, locationId, destInfo) {
        return {
            travel_mode: "WALK",
            destino: destInfo,
            source: alt.source,
            origin: alt.origin,
            distance_m: alt.distance_m,
            duration_min: alt.duration_min,
            encoded_polyline: alt.encoded_polyline,
            coordinates: alt.coordinates,
            steps: alt.steps,
            safety: alt.safety,
            nombre_ruta: destName,
            nivel_seguridad: alt.safety.classification === "SEGURA" ? "BAJO" : alt.safety.classification === "PRECAUCION" ? "MEDIO" : "ALTO",
            tiempo_estimado: alt.duration_min,
            distancia_m: alt.distance_m,
            fuente_trazado: alt.source,
            instrucciones: alt.steps,
            origen_usuario: originPoint,
            coordenadas: alt.coordinates,
            aviso: "Trayecto peatonal calculado con Google Routes.",
        };
    }
}
export default new RouteService();

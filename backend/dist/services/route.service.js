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
        let recommended = null;
        if (destination.type === "REGISTERED") {
            const dbDest = await routeRepository.findDestination(destination.id);
            if (!dbDest)
                throw new Error("Destino no encontrado");
            destPoint = [Number(dbDest.latitud), Number(dbDest.longitud)];
            destName = String(dbDest.nombre ?? "Destino registrado");
            destAddress = String(dbDest.direccion ?? "Loja, Ecuador");
            locationId = destination.id;
            placeId = null;
            sourceTag = "BASE_DATOS";
            try {
                recommended = (await routeRepository.findRecommendedByDestination(destination.id)) ?? null;
            }
            catch {
                recommended = null;
            }
        }
        else {
            // EXTERNAL destination
            destPoint = [destination.lat, destination.lng];
            destName = destination.name?.trim() || "Ruta peatonal";
            destAddress = destination.address?.trim() || "Loja, Ecuador";
            locationId = null;
            placeId = destination.placeId?.trim() || null;
            sourceTag = "GOOGLE_PLACES";
            recommended = null;
        }
        // ── Load active safety data for risk evaluation ─────────────────────
        const { reports: activeReports, zones: riskZones, safePlaces, emergencyServices } = await loadSafetyData("Loja");
        // ── Call pedestrianRoutingService.calculate (Google Routes WALK) ───
        const pedestrianRoute = await pedestrianRoutingService.calculate(originPoint, destPoint);
        if (pedestrianRoute && pedestrianRoute.coordinates.length >= 2) {
            const safety = routeSafetyService.evaluate(pedestrianRoute.coordinates, activeReports, riskZones, safePlaces, emergencyServices);
            const safetyLevel = safety.classification === "SEGURA"
                ? "BAJO"
                : safety.classification === "PRECAUCION"
                    ? "MEDIO"
                    : "ALTO";
            return {
                // Modern response fields
                travel_mode: "WALK",
                destino: {
                    id_ubicacion: locationId,
                    place_id: placeId,
                    nombre: destName,
                    direccion: destAddress,
                    latitud: destPoint[0],
                    longitud: destPoint[1],
                    fuente: sourceTag,
                },
                source: "GOOGLE_ROUTES",
                origin: { lat: origin.lat, lng: origin.lng },
                distance_m: pedestrianRoute.distanceMeters,
                duration_min: pedestrianRoute.durationMinutes,
                encoded_polyline: pedestrianRoute.encodedPolyline ?? "",
                coordinates: pedestrianRoute.coordinates,
                steps: pedestrianRoute.instructions,
                safety,
                // Legacy compatibility fields
                id_ruta: locationId ? (recommended?.id_ruta ?? null) : null,
                nombre_ruta: locationId ? (recommended?.nombre_ruta ?? destName) : (destination.type === "EXTERNAL" ? (destination.name?.trim() || "Ruta peatonal") : destName),
                nivel_seguridad: locationId ? (recommended?.nivel_seguridad ?? safetyLevel) : null,
                tiempo_estimado: pedestrianRoute.durationMinutes,
                distancia_m: pedestrianRoute.distanceMeters,
                ruta_catalogada: locationId ? Boolean(recommended) : false,
                trazado_manual: false,
                trazado_peatonal: true,
                fuente_trazado: "GOOGLE_ROUTES",
                instrucciones: pedestrianRoute.instructions,
                origen_usuario: originPoint,
                coordenadas: pedestrianRoute.coordinates,
                aviso: "Trayecto peatonal calculado con Google Routes. Las condiciones de seguridad se evalúan con los datos del sistema.",
            };
        }
        // ── Fallback: straight-line referencial (ONLY when Google fails) ────
        console.warn("[RouteService] Google Routes no devolvió un trazado válido. " +
            "Devolviendo trazado referencial directo de respaldo.");
        const fallbackCoords = [originPoint, destPoint];
        const fallbackDist = Math.round(straightLineMeters(originPoint, destPoint));
        const fallbackDur = walkingMinutes(fallbackDist);
        const fallbackSafety = routeSafetyService.evaluate(fallbackCoords, activeReports, riskZones, safePlaces, emergencyServices);
        return {
            // Modern response fields
            travel_mode: "WALK",
            destino: {
                id_ubicacion: locationId,
                place_id: placeId,
                nombre: destName,
                direccion: destAddress,
                latitud: destPoint[0],
                longitud: destPoint[1],
                fuente: sourceTag,
            },
            source: "REFERENCIAL",
            origin: { lat: origin.lat, lng: origin.lng },
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
            id_ruta: locationId ? (recommended?.id_ruta ?? null) : null,
            nombre_ruta: locationId ? (recommended?.nombre_ruta ?? destName) : (destination.type === "EXTERNAL" ? (destination.name?.trim() || "Ruta peatonal") : destName),
            nivel_seguridad: null,
            tiempo_estimado: fallbackDur,
            distancia_m: fallbackDist,
            ruta_catalogada: locationId ? Boolean(recommended) : false,
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
            origen_usuario: originPoint,
            coordenadas: fallbackCoords,
            aviso: "No fue posible calcular una ruta peatonal real. La referencia directa no debe utilizarse como navegación.",
        };
    }
}
export default new RouteService();

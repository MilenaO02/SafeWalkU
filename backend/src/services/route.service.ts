import routeRepository from "../repositories/route.repository.js";
import reportRepository from "../repositories/report.repository.js";
import pedestrianRoutingService from "./pedestrian-routing.service.js";
import routeSafetyService, {
    IncidentReport,
    RiskZone,
    SafePlace,
    EmergencyService,
} from "./route-safety.service.js";
import lugarRepository from "../repositories/lugar.repository.js";
import servicioRepository from "../repositories/servicio.repository.js";
import riskZoneRepository from "../repositories/risk-zone.repository.js";
import riskZoneSafetyService from "./risk-zone-safety.service.js";
import { selectRouteAlternatives } from "./route-selection.js";

// ─────────────────────────────────────────────────────────────────────────────
// Public input types
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateRouteInput {
    nombre_ruta: string;
    descripcion?: string;
    nivel_seguridad: "BAJO" | "MEDIO" | "ALTO";
    tiempo_estimado: number;
    ubicaciones: number[];
    puntos: Array<{
        latitud: number;
        longitud: number;
        tipo?: "INICIO" | "INTERMEDIO" | "CRUCE" | "APOYO" | "DESTINO";
        observacion?: string;
    }>;
}

export type UpdateRouteInput = Partial<CreateRouteInput>;

export interface TraceRouteParams {
    origin: {
        lat: number;
        lng: number;
    };
    destination:
        | {
              type: "REGISTERED";
              id: number;
          }
        | {
              type: "EXTERNAL";
              lat: number;
              lng: number;
              name?: string;
              address?: string;
              placeId?: string;
          };
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Haversine distance in metres between two [lat, lng] pairs. */
function straightLineMeters(
    a: [number, number],
    b: [number, number]
): number {
    const R = 6_371_000;
    const r = (d: number) => (d * Math.PI) / 180;
    const dLat = r(b[0] - a[0]);
    const dLng = r(b[1] - a[1]);
    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
}

/** Walking minutes at ~80 m/min (comfortable urban pace). */
function walkingMinutes(distanceM: number): number {
    return Math.max(1, Math.ceil(distanceM / 80));
}

/** Load active incident reports and risk zones from the DB (best-effort). */
async function loadSafetyData(city: string): Promise<{
    reports: IncidentReport[];
    zones: RiskZone[];
    safePlaces: SafePlace[];
    emergencyServices: EmergencyService[];
}> {
    try {
        const rawReports = await reportRepository.findActiveReportsByCity(city);
        const reports: IncidentReport[] = rawReports.map((r) => ({
            id_reporte: Number(r.id_reporte),
            descripcion: String(r.descripcion ?? ""),
            nivel_riesgo: r.nivel_riesgo as "BAJO" | "MEDIO" | "ALTO",
            fecha_reporte: r.fecha_reporte as Date | string,
            latitud: Number(r.latitud),
            longitud: Number(r.longitud),
        }));

        const rawZones = await reportRepository.findRiskZonesByCity(city);
        const zones: RiskZone[] = rawZones.map((z) => ({
            id_reporte: Number(z.id_reporte),
            ubicacion_nombre: String(z.ubicacion_nombre ?? ""),
            nivel_riesgo: z.nivel_riesgo as "BAJO" | "MEDIO" | "ALTO",
            radio_metros: Number(z.radio_metros) || 80,
            latitud: Number(z.latitud),
            longitud: Number(z.longitud),
        }));
        
        const rawPlaces = await lugarRepository.findAll();
        const safePlaces: SafePlace[] = rawPlaces.map((p: any) => ({
            id_lugar_seguro: Number(p.id_lugar_seguro),
            nombre: String(p.ubicacion_nombre || p.nombre || "Lugar Seguro"),
            latitud: Number(p.latitud),
            longitud: Number(p.longitud),
        }));
        
        const rawServices = await servicioRepository.findAll();
        const emergencyServices: EmergencyService[] = rawServices.map((s: any) => ({
            id_servicio: Number(s.id_servicio),
            nombre: String(s.ubicacion_nombre || s.nombre || "Servicio Emergencia"),
            latitud: Number(s.latitud),
            longitud: Number(s.longitud),
        }));

        return { reports, zones, safePlaces, emergencyServices };
    } catch (err) {
        console.warn(
            "[RouteService] No fue posible cargar datos de seguridad de MySQL:",
            err instanceof Error ? err.message : err
        );
        return { reports: [], zones: [], safePlaces: [], emergencyServices: [] };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// RouteService
// ─────────────────────────────────────────────────────────────────────────────

class RouteService {
    findAll() { return routeRepository.findAll(); }

    async findById(id: number) {
        if (!Number.isInteger(id) || id < 1) throw new Error("ID de ruta inválido");
        const route = await routeRepository.findById(id);
        if (!route) throw new Error("Ruta no encontrada");
        return route;
    }

    async create(data: any) {
        const id = await routeRepository.create(data);
        return this.findById(id);
    }

    async update(id: number, data: any) {
        await this.findById(id);
        await routeRepository.update(id, data);
        return this.findById(id);
    }

    async delete(id: number) {
        await this.findById(id);
        await routeRepository.delete(id);
        return { success: true, message: "Ruta eliminada correctamente" };
    }



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
    async trazarRuta(params: TraceRouteParams) {
        const { origin, destination } = params;
        const originPoint: [number, number] = [origin.lat, origin.lng];

        // ── Resolve destination ─────────────────────────────────────────────
        let destPoint: [number, number];
        let destName: string;
        let destAddress: string;
        let locationId: number | null = null;
        let placeId: string | null = null;
        let sourceTag: "BASE_DATOS" | "GOOGLE_PLACES" = "GOOGLE_PLACES";

        if (destination.type === "REGISTERED") {
            const dbDest = await routeRepository.findDestination(destination.id);
            if (!dbDest) throw new Error("Destino no encontrado");
            destPoint = [Number(dbDest.latitud), Number(dbDest.longitud)];
            destName = String(dbDest.nombre ?? "Destino registrado");
            destAddress = String(dbDest.direccion ?? "Loja, Ecuador");
            locationId = destination.id;
            sourceTag = "BASE_DATOS";
        } else {
            destPoint = [destination.lat, destination.lng];
            destName = destination.name?.trim() || "Ruta peatonal";
            destAddress = destination.address?.trim() || "Loja, Ecuador";
            placeId = destination.placeId?.trim() || null;
            sourceTag = "GOOGLE_PLACES";
        }

        // ── Load active safety data ─────────────────────────────────────────
        const { reports: activeReports, zones: riskZones, safePlaces, emergencyServices } = await loadSafetyData("Loja");
        // Las zonas permanentes son poligonos reales. Si la migracion aun no se
        // ha aplicado, no se debe fabricar un trazado: la consulta fallara y el
        // error operativo debe resolverse antes de habilitar el modulo.
        const permanentRiskZones = await riskZoneRepository.findAll(true);

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
        const findIntermediatePoint = (coords: [number, number][]) => {
            if (coords.length < 4) return null;
            const midIdx = Math.floor(coords.length / 2);
            const midPoint = coords[midIdx];

            let best: { place: SafePlace; dist: number } | null = null;
            for (const place of safePlaces) {
                const placeCoord: [number, number] = [Number(place.latitud), Number(place.longitud)];
                if (!Number.isFinite(placeCoord[0]) || !Number.isFinite(placeCoord[1])) continue;
                const dist = straightLineMeters(midPoint, placeCoord);
                if (dist <= 500 && (!best || dist < best.dist)) {
                    best = { place, dist };
                }
            }
            // Also try emergency services
            for (const svc of emergencyServices) {
                const svcCoord: [number, number] = [Number(svc.latitud), Number(svc.longitud)];
                if (!Number.isFinite(svcCoord[0]) || !Number.isFinite(svcCoord[1])) continue;
                const dist = straightLineMeters(midPoint, svcCoord);
                if (dist <= 500 && (!best || dist < best.dist)) {
                    best = { place: { id_lugar_seguro: svc.id_servicio, nombre: svc.nombre, latitud: svc.latitud, longitud: svc.longitud }, dist };
                }
            }
            if (!best) return null;
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
        const buildAlternative = (route: typeof allRoutes[0], label: string) => {
            const reportSafety = routeSafetyService.evaluate(
                route.coordinates,
                activeReports,
                riskZones,
                safePlaces,
                emergencyServices
            );
            const safety = riskZoneSafetyService.merge(reportSafety, route.coordinates, permanentRiskZones as any);

            const walkingNotRecommended = route.distanceMeters > MAX_WALKING_METERS || route.durationMinutes > MAX_WALKING_MINUTES;
            const walkingAdvisory: string[] = [];

            if (walkingNotRecommended) {
                walkingAdvisory.push(
                    `Este trayecto mide ${route.distanceMeters} m y tomaría aproximadamente ${route.durationMinutes} min a pie. No se recomienda completamente a pie por su distancia y duración.`
                );
                walkingAdvisory.push(
                    "Se recomienda continuar desde un punto intermedio mediante un medio de transporte disponible."
                );
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
                duration_seconds: route.durationSeconds,
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
            const evaluated = allRoutes.map((r, i) =>
                buildAlternative(r, i === 0 ? "RUTA_A" : `RUTA_${String.fromCharCode(66 + i - 1)}`)
            );

            // La recomendada prioriza seguridad. La más rápida siempre conserva
            // la menor duración real devuelta por Google Routes; no se sustituye
            // por la segunda alternativa solo para evitar una tarjeta duplicada.
            const { recommended, alternatives, comparison } = selectRouteAlternatives(evaluated);

            const isSingleRoute = alternatives.length === 1;

            return {
                single_route: isSingleRoute,
                single_route_message: isSingleRoute
                    ? "Google Routes devolvió una única alternativa; esta es la más rápida y la mejor evaluada con los datos disponibles."
                    : null,
                alternatives,
                comparison,
                // Legacy compat (first route)
                ...this.legacyFields(recommended, originPoint, destName, locationId, destInfo),
            };
        }

        throw new Error("No fue posible obtener la ruta peatonal.");
    }

    /** Build legacy-compat top-level fields from the recommended alternative */
    private legacyFields(alt: any, originPoint: [number, number], destName: string, locationId: number | null, destInfo: any) {
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

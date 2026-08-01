import { z } from "zod";

const orderedLocations = z.array(z.number().int().positive())
    .min(2, "Una ruta debe incluir al menos dos ubicaciones")
    .max(50, "Una ruta no puede superar 50 puntos")
    .refine((ids) => new Set(ids).size === ids.length, "Las ubicaciones de una ruta no pueden repetirse");

const routePoint = z.object({
    latitud: z.number().min(-90).max(90),
    longitud: z.number().min(-180).max(180),
    tipo: z.enum(["INICIO", "INTERMEDIO", "CRUCE", "APOYO", "DESTINO"]).optional(),
    observacion: z.string().trim().max(255).optional()
}).strict();

const tracedPoints = z.array(routePoint)
    .min(2, "El trazado debe incluir al menos dos puntos")
    .max(500, "El trazado no puede superar 500 puntos")
    .superRefine((points, context) => {
        for (let index = 1; index < points.length; index += 1) {
            if (points[index].latitud === points[index - 1].latitud
                && points[index].longitud === points[index - 1].longitud) {
                context.addIssue({ code: z.ZodIssueCode.custom, path: [index], message: "No se permiten puntos consecutivos iguales" });
            }
        }
    });

const routeEndpoint = z.object({
    nombre: z.string().trim().min(1).max(150),
    direccion: z.string().trim().max(255).optional().default(""),
    latitud: z.number().min(-90).max(90),
    longitud: z.number().min(-180).max(180),
    place_id: z.string().trim().max(255).optional(),
    fuente: z.enum(["GOOGLE_PLACES", "GPS", "MAP_CLICK"])
}).strict();

const routeFields = {
    nombre_ruta: z.string().trim().min(3).max(100),
    descripcion: z.string().trim().max(255).optional(),
    nivel_seguridad: z.enum(["BAJO", "MEDIO", "ALTO"]),
    tiempo_estimado: z.number().int().positive().max(1440),
    ubicaciones: orderedLocations.optional(),
    puntos: tracedPoints,
    origen: routeEndpoint.optional(),
    destino: routeEndpoint.optional(),
    fuente_trazado: z.literal("GOOGLE_ROUTES").optional(),
    distancia_m: z.number().int().positive().max(2_000_000).optional(),
    duracion_segundos: z.number().int().positive().max(172_800).optional()
};

export const createRouteSchema = z.object(routeFields).strict().superRefine((data, context) => {
    const externalEndpoints = Boolean(data.origen || data.destino);
    if (externalEndpoints && (!data.origen || !data.destino)) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: "Debe indicar origen y destino completos.", path: ["origen"] });
    }
    if (!externalEndpoints && !data.ubicaciones?.length) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: "Debe indicar origen y destino de la ruta." });
    }
});

export const updateRouteSchema = z.object({
    nombre_ruta: routeFields.nombre_ruta.optional(),
    descripcion: routeFields.descripcion,
    nivel_seguridad: routeFields.nivel_seguridad.optional(),
    tiempo_estimado: routeFields.tiempo_estimado.optional(),
    ubicaciones: routeFields.ubicaciones.optional(),
    puntos: routeFields.puntos.optional(),
    origen: routeFields.origen,
    destino: routeFields.destino,
    fuente_trazado: routeFields.fuente_trazado,
    distancia_m: routeFields.distancia_m,
    duracion_segundos: routeFields.duracion_segundos
}).strict().superRefine((data, context) => {
    if ((data.origen && !data.destino) || (!data.origen && data.destino)) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ["origen"], message: "Debe indicar origen y destino completos." });
    }
    if (Object.keys(data).length === 0) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: "Debe enviar al menos un campo" });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// traceRouteQuerySchema
//
// Accepts exactly ONE of two destination modalities:
//
//   Modalidad 1 — registered location (destino_id)
//     origen_lat, origen_lng, destino_id
//
//   Modalidad 2 — external / Google Places destination (destino_lat + destino_lng)
//     origen_lat, origen_lng, destino_lat, destino_lng
//     + optional: destino_nombre (max 150), destino_direccion (max 255), place_id (max 255)
//
// Rules enforced:
//   ✔ origen_lat + origen_lng are always required
//   ✔ exactly one modality must be present
//   ✔ mixing destino_id with destino_lat/lng is rejected (422)
//   ✔ omitting both modalities is rejected (422)
// ─────────────────────────────────────────────────────────────────────────────

export const traceRouteQuerySchema = z
    .object({
        origen_lat: z.coerce.number().min(-90).max(90),
        origen_lng: z.coerce.number().min(-180).max(180),
        destino_id: z.coerce.number().int().positive().optional(),
        destino_lat: z.coerce.number().min(-90).max(90).optional(),
        destino_lng: z.coerce.number().min(-180).max(180).optional(),
        destino_nombre: z.string().trim().max(150).optional(),
        destino_direccion: z.string().trim().max(255).optional(),
        place_id: z.string().trim().max(255).optional(),
    })
    .strict()
    .superRefine((data, ctx) => {
        const hasDestinoId = data.destino_id !== undefined;
        const hasLat = data.destino_lat !== undefined;
        const hasLng = data.destino_lng !== undefined;
        const hasCoords = hasLat && hasLng;
        const hasPartialCoords = (hasLat && !hasLng) || (!hasLat && hasLng);

        if (hasPartialCoords) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Debe proporcionar tanto destino_lat como destino_lng para un destino externo.",
            });
            return;
        }

        if (hasDestinoId && (hasLat || hasLng)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "No puede enviar destino_id junto con destino_lat o destino_lng.",
            });
            return;
        }

        if (!hasDestinoId && !hasCoords) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Debe indicar únicamente destino_id (destino registrado) o las coordenadas del destino (destino_lat y destino_lng).",
            });
            return;
        }
    });

export type TraceRouteQueryInput = z.infer<typeof traceRouteQuerySchema>;

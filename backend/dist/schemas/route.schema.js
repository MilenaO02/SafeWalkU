import { z } from "zod";
// ─────────────────────────────────────────────────────────────────────────────
// Shared sub-schemas for route CRUD
// ─────────────────────────────────────────────────────────────────────────────
const orderedLocations = z
    .array(z.number().int().positive())
    .min(2, "Una ruta debe incluir al menos dos ubicaciones")
    .max(50, "Una ruta no puede superar 50 puntos")
    .refine((ids) => new Set(ids).size === ids.length, "Las ubicaciones de una ruta no pueden repetirse");
const routePoint = z
    .object({
    latitud: z.number().min(-90).max(90),
    longitud: z.number().min(-180).max(180),
    tipo: z.enum(["INICIO", "INTERMEDIO", "CRUCE", "APOYO", "DESTINO"]).optional(),
    observacion: z.string().trim().max(255).optional(),
})
    .strict();
const tracedPoints = z
    .array(routePoint)
    .min(2, "El trazado debe incluir al menos dos puntos")
    .max(500, "El trazado no puede superar 500 puntos")
    .superRefine((points, ctx) => {
    for (let i = 1; i < points.length; i++) {
        if (points[i].latitud === points[i - 1].latitud &&
            points[i].longitud === points[i - 1].longitud) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: [i],
                message: "No se permiten puntos consecutivos iguales",
            });
        }
    }
});
const routeFields = {
    nombre_ruta: z.string().trim().min(3).max(100),
    descripcion: z.string().trim().max(255).optional(),
    nivel_seguridad: z.enum(["BAJO", "MEDIO", "ALTO"]),
    tiempo_estimado: z.number().int().positive().max(1440),
    ubicaciones: orderedLocations,
    puntos: tracedPoints,
};
export const createRouteSchema = z.object(routeFields).strict();
export const updateRouteSchema = z
    .object({
    nombre_ruta: routeFields.nombre_ruta.optional(),
    descripcion: routeFields.descripcion,
    nivel_seguridad: routeFields.nivel_seguridad.optional(),
    tiempo_estimado: routeFields.tiempo_estimado.optional(),
    ubicaciones: routeFields.ubicaciones.optional(),
    puntos: routeFields.puntos.optional(),
})
    .strict()
    .refine((data) => Object.keys(data).length > 0, "Debe enviar al menos un campo");
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
//     + optional: destino_nombre, destino_direccion, place_id
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
    destino_nombre: z.string().trim().max(200).optional(),
<<<<<<< HEAD
    destino_direccion: z.string().trim().max(255).optional(),
    place_id: z.string().trim().min(1).max(255).optional()
}).strict().superRefine((data, context) => {
    const hasRegisteredDestination = data.destino_id !== undefined;
    const hasLatitude = data.destino_lat !== undefined;
    const hasLongitude = data.destino_lng !== undefined;
    const hasExternalCoordinates = hasLatitude && hasLongitude;
    if (hasLatitude !== hasLongitude) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: [hasLatitude ? "destino_lng" : "destino_lat"], message: "Debe enviar latitud y longitud del destino" });
    }
    if (hasRegisteredDestination && (hasLatitude || hasLongitude)) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ["destino_id"], message: "destino_id y las coordenadas externas son modalidades excluyentes" });
    }
    if (!hasRegisteredDestination && !hasExternalCoordinates) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ["destino_id"], message: "Debe indicar destino_id o destino_lat + destino_lng" });
=======
    destino_direccion: z.string().trim().max(300).optional(),
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
>>>>>>> origin/main
    }
});

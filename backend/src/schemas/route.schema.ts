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

const routeFields = {
    nombre_ruta: z.string().trim().min(3).max(100),
    descripcion: z.string().trim().max(255).optional(),
    nivel_seguridad: z.enum(["BAJO", "MEDIO", "ALTO"]),
    tiempo_estimado: z.number().int().positive().max(1440),
    ubicaciones: orderedLocations,
    puntos: tracedPoints
};

export const createRouteSchema = z.object(routeFields).strict();

export const updateRouteSchema = z.object({
    nombre_ruta: routeFields.nombre_ruta.optional(),
    descripcion: routeFields.descripcion,
    nivel_seguridad: routeFields.nivel_seguridad.optional(),
    tiempo_estimado: routeFields.tiempo_estimado.optional(),
    ubicaciones: routeFields.ubicaciones.optional(),
    puntos: routeFields.puntos.optional()
}).strict().refine((data) => Object.keys(data).length > 0, "Debe enviar al menos un campo");

export const traceRouteQuerySchema = z.object({
    origen_lat: z.coerce.number().min(-90).max(90),
    origen_lng: z.coerce.number().min(-180).max(180),
    destino_id: z.coerce.number().int().positive().optional(),
    destino_lat: z.coerce.number().min(-90).max(90).optional(),
    destino_lng: z.coerce.number().min(-180).max(180).optional(),
    destino_nombre: z.string().trim().max(200).optional(),
    destino_direccion: z.string().trim().max(300).optional(),
    place_id: z.string().trim().max(255).optional()
}).strict().refine((data) => Boolean(data.destino_id) || (data.destino_lat !== undefined && data.destino_lng !== undefined), {
    message: "Debe indicar destino_id o coordenadas del destino"
});

import { z } from "zod";

export const updateLocationSchema = z.object({
    nombre: z.string().trim().min(3).max(100),
    direccion: z.string().trim().min(3).max(255),
    latitud: z.number().min(-90).max(90),
    longitud: z.number().min(-180).max(180)
}).strict();

export const createLocationSchema = z.object({
    nombre: z.string().trim().min(3).max(100),
    direccion: z.string().trim().min(3).max(255),
    latitud: z.number().min(-90).max(90),
    longitud: z.number().min(-180).max(180),
    tipo: z.enum(["GENERAL", "UNIVERSIDAD", "CALLE", "PARQUE", "BARRIO", "PARADERO", "LUGAR_SEGURO", "SERVICIO_EMERGENCIA"]).optional().default("CALLE"),
    radio_metros: z.number().min(10).max(500).optional().default(50)
}).strict();

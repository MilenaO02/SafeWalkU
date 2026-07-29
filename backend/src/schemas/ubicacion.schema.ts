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
    latitud: z.number().min(-4.15).max(-3.80),
    longitud: z.number().min(-79.35).max(-79.05),
    tipo: z.enum(["GENERAL", "LUGAR_SEGURO", "SERVICIO_EMERGENCIA"]),
    radio_metros: z.number().min(10).max(500).optional().default(50)
}).strict();

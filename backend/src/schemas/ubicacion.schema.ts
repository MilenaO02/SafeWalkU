import { z } from "zod";

export const updateLocationSchema = z.object({
    nombre: z.string().trim().min(3).max(100),
    direccion: z.string().trim().min(3).max(255),
    latitud: z.number().min(-4.15).max(-3.80),
    longitud: z.number().min(-79.35).max(-79.05)
}).strict();

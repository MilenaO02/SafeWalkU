import { z } from "zod";
export const updateLocationSchema = z.object({
    nombre: z.string().trim().min(3).max(100),
    direccion: z.string().trim().min(3).max(255),
    latitud: z.number().min(-90).max(90),
    longitud: z.number().min(-180).max(180)
}).strict();

import { z } from "zod";
export const evidenceUploadSchema = z.object({
    id_reporte: z.coerce.number().int().positive()
}).strict();

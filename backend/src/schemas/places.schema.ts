import { z } from "zod";

const sessionToken = z.string().trim().min(8).max(100).optional();

export const placesAutocompleteSchema = z.object({
    input: z.string().trim().min(2).max(120),
    includedRegionCodes: z.array(z.string().regex(/^[a-z]{2}$/i)).min(1).max(5).default(["ec"]),
    languageCode: z.string().regex(/^[a-z]{2}$/i).default("es"),
    regionCode: z.string().regex(/^[a-z]{2}$/i).default("EC"),
    sessionToken,
    locationBias: z.object({
        circle: z.object({
            center: z.object({
                latitude: z.number().min(-90).max(90),
                longitude: z.number().min(-180).max(180)
            }).strict(),
            radius: z.number().positive().max(50000)
        }).strict()
    }).strict().optional()
}).strict();

export const placeDetailsSchema = z.object({
    place: z.string().trim().regex(/^places\/[A-Za-z0-9_-]+$/, "Identificador de lugar inválido"),
    languageCode: z.string().regex(/^[a-z]{2}$/i).default("es"),
    sessionToken
}).strict();

import { z } from 'zod';

export const ItineraryCreateSchema = z.object({
    productId: z.string().min(1, '缺少產品 ID'),
    day: z.number().min(1, '必須填寫天數'),
    title: z.string().min(1, '請輸入標題'),
    subtitle: z.string().optional().nullable(),
    content: z.string().optional().nullable(),
    breakfast: z.string().optional().nullable(),
    lunch: z.string().optional().nullable(),
    dinner: z.string().optional().nullable(),
    hotel: z.string().optional().nullable(),
    note: z.string().optional().nullable(),
    attractions: z.array(z.string()).optional().default([]),
    attractionTypes: z.array(z.number()).optional().default([]),
    featured: z.boolean().optional().default(false),
    depart: z.string().optional().nullable(),
    arrive: z.string().optional().nullable(),
    duration: z.string().optional().nullable(),
    distance: z.string().optional().nullable(),
});

export const ItineraryEditSchema = ItineraryCreateSchema.partial();

export type ItineraryCreateValues = z.infer<typeof ItineraryCreateSchema>;
export type ItineraryEditValues = z.infer<typeof ItineraryEditSchema>;

import { z } from 'zod';

// 🔹 景點 + 參觀方式
export const ItineraryAttractionSchema = z.object({
    attractionId: z.string().min(1, '缺少景點 ID'),
    visitType: z.enum(['INSIDE', 'OUTSIDE', 'PHOTO', 'PASSBY']),
});

/** 建立 Itinerary 用 Schema */
export const ItineraryCreateSchema = z.object({
    productId: z.string().min(1),
    day: z.number().min(1),
    title: z.string().min(1),
    subtitle: z.string().nullable().optional(),
    content: z.string().nullable().optional(),
    breakfast: z.string().nullable().optional(),
    lunch: z.string().nullable().optional(),
    dinner: z.string().nullable().optional(),
    hotel: z.string().nullable().optional(),
    note: z.string().nullable().optional(),
    featured: z.boolean().default(false),
    depart: z.string().nullable().optional(),
    arrive: z.string().nullable().optional(),
    duration: z.string().nullable().optional(),
    distance: z.string().nullable().optional(),

    // 🔹 attractions 改成物件陣列
    attractions: z.array(ItineraryAttractionSchema).default([]),
});

/** 編輯 Itinerary 用 Schema */
export const ItineraryEditSchema = ItineraryCreateSchema.partial();

export type ItineraryCreateValues = z.infer<typeof ItineraryCreateSchema>;
export type ItineraryEditValues = z.infer<typeof ItineraryEditSchema>;

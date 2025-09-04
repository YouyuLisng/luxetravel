import { z } from 'zod';

// 景點
export const ItineraryAttractionSchema = z.object({
    attractionId: z.string().min(1, '缺少景點 ID'),
    visitType: z.enum(['INSIDE', 'OUTSIDE', 'PHOTO', 'PASSBY'], {
        required_error: '缺少參觀方式',
    }),
});

// 路線
export const ItineraryRouteSchema = z.object({
    depart: z.string().nullable().optional(),
    arrive: z.string().nullable().optional(),
    duration: z.string().nullable().optional(),
    distance: z.string().nullable().optional(),
});

// 單筆行程
export const ItinerarySchema = z.object({
    day: z.number().min(1, '缺少天數'),
    title: z.string().min(1, '缺少標題'),
    subtitle: z.string().nullable().optional(),
    content: z.string().nullable().optional(),
    breakfast: z.string().nullable().optional(),
    lunch: z.string().nullable().optional(),
    dinner: z.string().nullable().optional(),
    hotel: z.string().nullable().optional(),
    note: z.string().nullable().optional(),
    featured: z.boolean().optional(),
    routes: z.array(ItineraryRouteSchema).optional(),
    attractions: z.array(ItineraryAttractionSchema).optional(),
});

// 🚩 改成物件包陣列的 Schema
export const ItineraryCreateSchema = z.object({
    itineraries: z.array(ItinerarySchema).min(1, '至少要有一筆行程'),
});

// types
export type ItineraryCreateValues = z.infer<typeof ItinerarySchema>; // 單筆
export type ItineraryFormValues = z.infer<typeof ItineraryCreateSchema>; // { itineraries: [] }

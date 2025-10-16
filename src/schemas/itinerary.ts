import { z } from 'zod';

/** ===============================
 * 🚩 參觀方式（Visit Type）
 * =============================== */
export const VISIT_TYPE_VALUES = [
    'SELF_PAY', // 自費參觀（客人要自費）
    'INSIDE', // 入內參觀（費用已含）
    'OUTSIDE', // 下車參觀
    'PHOTO', // 拍照打卡
    'PASSBY', // 遠眺（車覽）
    'FEATURED', // 精選（界面中特別顯示）
] as const;

export type VisitType = (typeof VISIT_TYPE_VALUES)[number];

/** 可直接用於 select 選單 */
export const visitTypeOptions = [
    { value: 'SELF_PAY', label: '自費參觀（客人要自費）' },
    { value: 'INSIDE', label: '入內參觀（參訪費用已經包含在團費內）' },
    { value: 'OUTSIDE', label: '下車參觀' },
    { value: 'PHOTO', label: '拍照打卡' },
    { value: 'PASSBY', label: '遠眺（車覽）' },
    { value: 'FEATURED', label: '精選（界面中特別重點顯示）' },
];

/** ===============================
 * 🚩 景點
 * =============================== */
export const ItineraryAttractionSchema = z.object({
    attractionId: z.string().min(1, '缺少景點 ID'),
    visitType: z.enum(VISIT_TYPE_VALUES, {
        required_error: '缺少參觀方式',
    }),
});

/** ===============================
 * 🚩 路線
 * =============================== */
export const ItineraryRouteSchema = z.object({
    depart: z.string().nullable().optional(),
    arrive: z.string().nullable().optional(),
    duration: z.string().nullable().optional(),
    distance: z.string().nullable().optional(),
});

/** ===============================
 * 🚩 單筆行程
 * =============================== */
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

/** ===============================
 * 🚩 行程建立（物件包陣列）
 * =============================== */
export const ItineraryCreateSchema = z.object({
    itineraries: z.array(ItinerarySchema).min(1, '至少要有一筆行程'),
});

/** ===============================
 * 🚩 型別定義
 * =============================== */
export type ItineraryCreateValues = z.infer<typeof ItinerarySchema>; // 單筆
export type ItineraryFormValues = z.infer<typeof ItineraryCreateSchema>; // { itineraries: [] }

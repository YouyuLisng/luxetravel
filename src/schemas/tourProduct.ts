import { z } from 'zod';

/**
 * 🧩 共用行程產品 Schema（適用於新增與編輯）
 */
export const TourProductBaseSchema = z.object({
    /** 行程基本資訊 */
    code: z.string().min(1, '行程編號必填'),
    namePrefix: z.string().optional().nullable(),
    name: z.string().min(1, '行程名稱必填'),
    mainImageUrl: z.string().url('必須是合法的網址'),

    /** 內容描述 */
    summary: z.string().optional().nullable(),
    description: z.string().optional().nullable(),

    /** 🧩 天數與晚數（可清空、可為 null、不報錯） */
    days: z.preprocess(
        (val) => {
            if (val === '' || val === null || val === undefined) return null;
            const num = Number(val);
            return isNaN(num) ? null : num;
        },
        z.number().int().nullable().optional()
    ),

    nights: z.preprocess(
        (val) => {
            if (val === '' || val === null || val === undefined) return null;
            const num = Number(val);
            return isNaN(num) ? null : num;
        },
        z.number().int().nullable().optional()
    ),

    /** 交通與地點 */
    departAirport: z.string().min(1, '出發機場必填'),
    arriveCountry: z.string().min(1, '抵達國家必填'),
    arriveCity: z.string().min(1, '抵達城市必填'),
    arriveAirport: z.string().min(1, '抵達機場必填'),

    /** 分類 */
    category: z.string().min(1, '行程類別必填'),
    categoryId: z.string().min(1, '大類別必填'),
    subCategoryId: z.string().optional().nullable(),

    /** 🧾 價格（可清空、可為 null） */
    priceMin: z.preprocess(
        (val) => {
            if (val === '' || val === null || val === undefined) return null;
            const num = Number(val);
            return isNaN(num) ? null : num;
        },
        z.number().int().nullable().optional()
    ),

    priceMax: z.preprocess(
        (val) => {
            if (val === '' || val === null || val === undefined) return null;
            const num = Number(val);
            return isNaN(num) ? null : num;
        },
        z.number().int().nullable().optional()
    ),

    /** 標籤 / 國家 */
    tags: z.array(z.string()).optional().default([]),
    countries: z.array(z.string()).optional().default([]),

    /** 其他說明 */
    note: z.string().optional().nullable(),
    reminder: z.string().optional().nullable(),
    policy: z.string().optional().nullable(),

    /** 狀態與設定 */
    status: z.number().int().min(0).default(1),
    isFeatured: z.boolean().default(false),

    /** 人員 / 關聯資料 */
    staff: z.string().optional().nullable(),
    feedbackId: z.string().optional().nullable(),
});

/** 🆕 新增行程 Schema */
export const TourProductCreateSchema = TourProductBaseSchema;
export type TourProductCreateValues = z.infer<typeof TourProductCreateSchema>;

/** ✏️ 編輯行程 Schema */
export const TourProductEditSchema = TourProductBaseSchema.extend({
    id: z.string().min(1, 'ID 必填').optional(),
});
export type TourProductEditValues = z.infer<typeof TourProductEditSchema>;

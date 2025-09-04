import { z } from 'zod';

export const TourProductBaseSchema = z.object({
    code: z.string().min(1, '行程編號必填'),
    namePrefix: z.string().optional().nullable(),
    name: z.string().min(1, '行程名稱必填'),
    mainImageUrl: z.string().url('必須是合法的網址'), // ✅ 改成必填
    summary: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    days: z.number().int().min(1, '天數必須大於 0'),
    nights: z.number().int().min(0, '晚數不可小於 0'),
    departAirport: z.string().min(1, '出發機場必填'),
    arriveCountry: z.string().min(1, '抵達國家必填'),
    arriveCity: z.string().min(1, '抵達城市必填'),
    arriveAirport: z.string().min(1, '抵達機場必填'),
    category: z.string().min(1, '行程類別必填'), // 可改 enum

    categoryId: z.string().min(1, '大類別必填'),
    subCategoryId: z.string().optional().nullable(),

    priceMin: z.number().int().min(0, '最低價格必須 >= 0'),
    priceMax: z.number().int().optional().nullable(),
    tags: z.array(z.string()).optional().default([]),
    note: z.string().optional().nullable(),
    status: z.number().int().min(0).default(1), // 1=上架, 2=下架, 3=草稿
    staff: z.string().optional().nullable(),
    reminder: z.string().optional().nullable(),
    policy: z.string().optional().nullable(),
});

/** 新增行程 */
export const TourProductCreateSchema = TourProductBaseSchema;
export type TourProductCreateValues = z.infer<typeof TourProductCreateSchema>;

/** 編輯行程 */
export const TourProductEditSchema = TourProductBaseSchema.extend({
    id: z.string().min(1, 'ID 必填').optional(),
});
export type TourProductEditValues = z.infer<typeof TourProductEditSchema>;

import * as z from 'zod';

/** 建立用 */
export const BannerCreateSchema = z.object({
    imageUrl: z.string().min(1, '請提供圖片 URL'),

    // 標題必填，最多 10 個全形字
    title: z.string().min(1, '標題必填').max(10, '標題不能超過 10 個全形中文'),

    // 副標題選填，最多 30 個全形字
    subtitle: z
        .string()
        .max(30, '副標題不能超過 30 個全形中文')
        .nullable()
        .optional(),

    linkText: z.string().nullable().optional(),
    linkUrl: z.string().url('連結網址格式不正確').nullable().optional(),
    order: z.number().int().nonnegative().default(0),
});

/** 編輯用（全部欄位都可改） */
export const BannerEditSchema = z.object({
    imageUrl: z.string().min(1, '請提供圖片 URL'),

    title: z.string().min(1, '標題必填').max(10, '標題不能超過 10 個全形中文'),

    subtitle: z
        .string()
        .max(30, '副標題不能超過 30 個全形中文')
        .nullable()
        .optional(),

    linkText: z.string().nullable().optional(),
    linkUrl: z.string().url('連結網址格式不正確').nullable().optional(),
    order: z.number().int().nonnegative(),
});

export type BannerCreateValues = z.infer<typeof BannerCreateSchema>;
export type BannerEditValues = z.infer<typeof BannerEditSchema>;

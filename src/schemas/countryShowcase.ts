import { z } from 'zod';

export const CountryShowcaseCreateSchema = z.object({
    imageUrl: z.string().min(1, '請上傳圖片'),
    imageUrl1: z.string().optional().nullable(),
    imageUrl2: z.string().optional().nullable(),
    title: z.string().min(1, '請輸入標題'),
    subtitle: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    linkText: z.string().optional().nullable(),
    linkUrl: z
        .string()
        .url('連結格式不正確')
        .or(z.literal(''))
        .optional()
        .nullable(),
    order: z.number().int().nonnegative().default(0),

    /** ✅ 新增：關聯產品 ID 陣列 */
    tourProducts: z
        .array(z.string().min(1, '產品 ID 不可為空'))
        .optional()
        .default([]),
});

export const CountryShowcaseEditSchema = CountryShowcaseCreateSchema;

export type CountryShowcaseCreateValues = z.infer<
    typeof CountryShowcaseCreateSchema
>;
export type CountryShowcaseEditValues = z.infer<
    typeof CountryShowcaseEditSchema
>;

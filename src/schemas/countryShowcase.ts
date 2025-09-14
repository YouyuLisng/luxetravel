import { z } from 'zod';

export const CountryShowcaseCreateSchema = z.object({
    imageUrl: z.string().min(1, '請上傳圖片'),
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
});

export const CountryShowcaseEditSchema = CountryShowcaseCreateSchema; // 若編輯與新增欄位相同

export type CountryShowcaseCreateValues = z.infer<
    typeof CountryShowcaseCreateSchema
>;
export type CountryShowcaseEditValues = z.infer<
    typeof CountryShowcaseEditSchema
>;

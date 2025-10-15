// src/schemas/category.ts
import * as z from 'zod';

/** 建立用 */
export const CategoryCreateSchema = z.object({
    code: z
        .string({ required_error: '請輸入代碼' })
        .trim()
        .min(1, '請輸入代碼')
        .transform((v) => v.toUpperCase()),
    nameZh: z
        .string({ required_error: '請輸入中文名稱' })
        .trim()
        .min(1, '請輸入中文名稱'),
    nameEn: z
        .string({ required_error: '請輸入英文名稱' })
        .trim()
        .min(1, '請輸入英文名稱'),
    imageUrl: z.string().trim().url('圖片網址格式不正確').optional().nullable(),
    enabled: z.boolean().optional().default(true),
});

/** 編輯用（全部欄位皆可改，擇一即可） */
export const CategoryEditSchema = z.object({
    code: z
        .string()
        .trim()
        .min(1, '請輸入代碼')
        .transform((v) => v.toUpperCase())
        .optional(),
    nameZh: z.string().trim().min(1, '請輸入中文名稱').optional(),
    nameEn: z.string().trim().min(1, '請輸入英文名稱').optional(),
    imageUrl: z.string().trim().url('圖片網址格式不正確').optional().nullable(),
    enabled: z.boolean().optional(),
});

export type CategoryCreateValues = z.infer<typeof CategoryCreateSchema>;
export type CategoryEditValues = z.infer<typeof CategoryEditSchema>;

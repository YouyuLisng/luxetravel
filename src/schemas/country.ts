import * as z from 'zod';

/** 建立用 */
export const CountryCreateSchema = z.object({
    code: z.string().trim().min(1, '請輸入代碼'),
    nameEn: z.string().trim().min(1, '請輸入英文名稱'),
    nameZh: z.string().trim().min(1, '請輸入中文名稱'),
    imageUrl: z.string().trim().url('圖片網址格式不正確').optional().nullable(),
    enabled: z.boolean().optional().default(true),
});

/** 編輯用（全部欄位可改，皆為可選） */
export const CountryEditSchema = z.object({
    code: z.string().trim().min(1, '請輸入代碼').optional(),
    nameEn: z.string().trim().min(1, '請輸入英文名稱').optional(),
    nameZh: z.string().trim().min(1, '請輸入中文名稱').optional(),
    imageUrl: z.string().trim().url('圖片網址格式不正確').optional().nullable(),
    enabled: z.boolean().optional(),
});

export type CountryCreateValues = z.infer<typeof CountryCreateSchema>;
export type CountryEditValues = z.infer<typeof CountryEditSchema>;

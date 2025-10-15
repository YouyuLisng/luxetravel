import * as z from 'zod';

/** 建立用（必填：code/nameZh/nameEn/regionId/countryId） */
export const AirportCreateSchema = z.object({
    code: z.string().trim().min(1, '請輸入機場代碼'),
    nameEn: z.string().trim().min(1, '請輸入英文名稱'),
    nameZh: z.string().trim().min(1, '請輸入中文名稱'),
    regionId: z.string().trim().min(1, '請選擇地區'),
    countryId: z.string().trim().min(1, '請選擇國家'),
    imageUrl: z.string().trim().url('圖片網址格式不正確').optional().nullable(),
    enabled: z.boolean().optional(),
});

/** 編輯用（欄位皆可選填） */
export const AirportEditSchema = z.object({
    code: z.string().trim().min(1, '請輸入機場代碼').optional(),
    nameEn: z.string().trim().min(1, '請輸入英文名稱').optional(),
    nameZh: z.string().trim().min(1, '請輸入中文名稱').optional(),
    regionId: z.string().trim().min(1, '請選擇地區').optional(),
    countryId: z.string().trim().min(1, '請選擇國家').optional(),
    imageUrl: z.string().trim().url('圖片網址格式不正確').optional().nullable(),
    enabled: z.boolean().optional(),
});

export type AirportCreateValues = z.infer<typeof AirportCreateSchema>;
export type AirportEditValues = z.infer<typeof AirportEditSchema>;

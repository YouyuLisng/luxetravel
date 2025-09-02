// src/schemas/city.ts
import { z } from 'zod';

export const CityCreateSchema = z.object({
    code: z
        .string()
        .trim()
        .min(2, '代碼至少 2 碼')
        .max(10, '代碼不可超過 10 碼'),
    nameZh: z.string().trim().min(1, '請輸入中文名稱'),
    nameEn: z.string().trim().min(1, '請輸入英文名稱'),
    country: z
        .string()
        .trim()
        .min(2, '請輸入國家代碼或名稱')
        .max(50, '國家名稱過長'),
    imageUrl: z.string().trim().url('圖片網址格式錯誤').nullable().optional(),
    enabled: z.boolean().optional(),
});

export type CityCreateValues = z.infer<typeof CityCreateSchema>;

export const CityEditSchema = z.object({
    code: z
        .string()
        .trim()
        .min(2, '代碼至少 2 碼')
        .max(10, '代碼不可超過 10 碼')
        .optional(),
    nameZh: z.string().trim().min(1, '請輸入中文名稱').optional(),
    nameEn: z.string().trim().min(1, '請輸入英文名稱').optional(),
    country: z
        .string()
        .trim()
        .min(2, '請輸入國家代碼或名稱')
        .max(50, '國家名稱過長')
        .optional(),
    imageUrl: z.string().trim().url('圖片網址格式錯誤').nullable().optional(),
    enabled: z.boolean().optional(),
});

export type CityEditValues = z.infer<typeof CityEditSchema>;

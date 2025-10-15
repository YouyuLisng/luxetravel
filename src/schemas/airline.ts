import { z } from 'zod';

/** 共用：可為空字串時轉為 undefined（前端空值不擋） */
const emptyToUndefined = z
    .string()
    .transform((v) => (v?.trim() === '' ? undefined : v?.trim()));

/** 航空公司代碼：
 * - 一般使用 IATA 兩碼（如 CI、BR），有些情境也會用到三碼（ICAO）
 * - 這裡放寬為 2~3 位英數，實際存入時會再轉大寫
 */
const codeSchema = z
    .string({ required_error: '請輸入代碼' })
    .min(2, '代碼至少 2 碼')
    .max(3, '代碼最多 3 碼')
    .regex(/^[A-Za-z0-9]+$/, '代碼僅能為英數字');

/** 影像網址：可省略或清空（nullable 代表可傳 null 來清空） */
const imageUrlSchema = z
    .string()
    .url('圖片網址格式不正確')
    .or(z.literal(''))
    .optional()
    .nullable();

/** 建立 Airline：必填 code / nameZh / nameEn，其餘可選 */
export const AirlineCreateSchema = z.object({
    code: codeSchema,
    nameZh: z
        .string({ required_error: '請輸入中文名稱' })
        .min(1, '中文名稱不可為空')
        .transform((v) => v.trim()),
    nameEn: z
        .string({ required_error: '請輸入英文名稱' })
        .min(1, '英文名稱不可為空')
        .transform((v) => v.trim()),
    imageUrl: imageUrlSchema,
    enabled: z.boolean().optional(),
});

export type AirlineCreateValues = z.infer<typeof AirlineCreateSchema>;

/** 編輯 Airline：所有欄位皆可選，保留與 create 相同的格式限制 */
export const AirlineEditSchema = z.object({
    code: codeSchema.optional(),
    nameZh: emptyToUndefined.optional(),
    nameEn: emptyToUndefined.optional(),
    imageUrl: imageUrlSchema,
    enabled: z.boolean().optional(),
});

export type AirlineEditValues = z.infer<typeof AirlineEditSchema>;

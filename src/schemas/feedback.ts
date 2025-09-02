import { z } from 'zod';

/** 將空白字串轉成 undefined，避免被當成「有填但不合法」 */
const optionalStr = z
    .string()
    .transform((v) =>
        typeof v === 'string' && v.trim() === '' ? undefined : v
    )
    .optional();

const RequiredUrl = z.string().url();
const OptionalUrl = z
    .preprocess(
        (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
        z.string().url()
    )
    .optional();

/** 將 order 轉為整數，預設 0 */
const OrderInt = z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? 0 : Number(v)),
    z.number().int().min(0)
);

/* ===== FeedbackCountry ===== */
export const FeedbackCountryCreateSchema = z.object({
    name: z.string().min(1, '必填'),
    nameZh: z.string().min(1, '必填'),
    code: z.string().min(1, '必填'),
});
export type FeedbackCountryCreateValues = z.infer<
    typeof FeedbackCountryCreateSchema
>;

export const FeedbackCountryEditSchema = z.object({
    name: z.string().min(1).optional(),
    nameZh: z.string().min(1).optional(),
    code: z.string().min(1).optional(),
});
export type FeedbackCountryEditValues = z.infer<
    typeof FeedbackCountryEditSchema
>;

/* ===== Feedback ===== */
export const FeedbackCreateSchema = z.object({
    title: z.string().min(1, '必填'),
    subtitle: optionalStr,
    content: optionalStr,
    nickname: z.string().min(1, '必填'),
    imageUrl: RequiredUrl,
    linkUrl: RequiredUrl,
    linekName: optionalStr, // 依你現在的欄位名
    order: OrderInt,
    /** 這裡用於同時建立關聯的國家 ID 陣列（可空） */
    countryIds: z.array(z.string().min(1)).optional(),
});
export type FeedbackCreateValues = z.infer<typeof FeedbackCreateSchema>;

export const FeedbackEditSchema = z.object({
    title: z.string().min(1).optional(),
    subtitle: optionalStr,
    content: optionalStr,
    nickname: z.string().min(1).optional(),
    imageUrl: RequiredUrl.optional(), // 編輯可不傳，傳就驗 URL
    linkUrl: RequiredUrl.optional(),
    linekName: optionalStr,
    order: OrderInt.optional(),
    /** 覆寫關聯國家（可選，若提供則以此為準） */
    countryIds: z.array(z.string().min(1)).optional(),
});
export type FeedbackEditValues = z.infer<typeof FeedbackEditSchema>;

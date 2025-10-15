import { z } from 'zod';

/** 將空白字串轉成 undefined */
const optionalStr = z
    .string()
    .transform((v) =>
        typeof v === 'string' && v.trim() === '' ? undefined : v
    )
    .optional();

const RequiredUrl = z.string().url();

/* ===== Feedback ===== */
export const FeedbackCreateSchema = z.object({
    title: z.string().min(1, '必填'),
    content: optionalStr,
    nickname: z.string().min(1, '必填'),
    imageUrl: RequiredUrl,
    linkUrl: RequiredUrl,
});
export type FeedbackCreateValues = z.infer<typeof FeedbackCreateSchema>;

export const FeedbackEditSchema = z.object({
    title: z.string().min(1).optional(),
    content: optionalStr,
    nickname: z.string().min(1).optional(),
    imageUrl: RequiredUrl.optional(),
    linkUrl: RequiredUrl.optional(),
});
export type FeedbackEditValues = z.infer<typeof FeedbackEditSchema>;

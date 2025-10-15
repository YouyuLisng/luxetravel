// src/schemas/testimonial.ts
import { z } from 'zod';
import { FeedbackMode } from '@prisma/client';

const base = z.object({
    mode: z.nativeEnum(FeedbackMode),
    nickname: z.string().trim().optional().nullable(),
    stars: z
        .number()
        .int()
        .min(1, '最少 1 顆星')
        .max(5, '最多 5 顆星')
        .optional()
        .nullable(),
    content: z.string().min(1, '請輸入內容'),
    linkUrl: z.string().url('請輸入正確的網址').optional().nullable(),
    imageUrl: z.string().url('請輸入正確的圖片網址').optional().nullable(),
    order: z.number().int().optional().default(0),
});

export const TestimonialCreateSchema = base;
export type TestimonialCreateValues = z.infer<typeof TestimonialCreateSchema>;

export const TestimonialEditSchema = base.extend({
    id: z.string().min(1, 'ID 必填').optional(),
});
export type TestimonialEditValues = z.infer<typeof TestimonialEditSchema>;


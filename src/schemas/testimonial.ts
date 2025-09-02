// src/schemas/testimonial.ts
import { z } from 'zod';
import { FeedbackMode } from '@prisma/client';

const base = z.object({
    mode: z.nativeEnum(FeedbackMode),
    nickname: z.string().trim().optional().nullable(),
    stars: z.number().int().min(1).max(5).optional().nullable(),
    content: z.string().min(1, '請輸入內容'),
    linkUrl: z.string().url().optional().nullable(),
    order: z.number().int().optional().default(0),
});

export const TestimonialCreateSchema = base;
export type TestimonialCreateValues = z.infer<typeof TestimonialCreateSchema>;

export const TestimonialEditSchema = base;
export type TestimonialEditValues = z.infer<typeof TestimonialEditSchema>;

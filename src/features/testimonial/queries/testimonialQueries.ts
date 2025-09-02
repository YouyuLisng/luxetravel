import { queryOptions } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { z } from 'zod';

/** 以 zod 定義 FeedbackMode 聯集字面型別 */
export const FeedbackModeZod = z.enum(['REAL', 'MARKETING']);
export type FeedbackMode = z.infer<typeof FeedbackModeZod>;

/** 後端回傳的實體 */
export const testimonialSchema = z.object({
    id: z.string(),
    mode: FeedbackModeZod, // ← 改成 enum
    nickname: z.string().nullish(),
    stars: z.number().int().min(1).max(5).nullish(),
    content: z.string(),
    linkUrl: z.string().url().nullish(),
    order: z.number().int(),
    createdAt: z.string(),
    updatedAt: z.string(),
});
export type TestimonialEntity = z.infer<typeof testimonialSchema>;

/** 建立/更新 DTO（給 UI 與 server actions 共用） */
export type TestimonialDTO = {
    mode: FeedbackMode; // ← 改掉 string
    content: string;
    order?: number; // 可不帶，後端預設 0
    nickname?: string | null;
    stars?: number | null; // 1~5
    linkUrl?: string | null;
};

export const KEYS = {
    list: () => ['testimonial'] as const,
    detail: (id: string) => ['testimonial', id] as const,
};

export const testimonialsQuery = () =>
    queryOptions({
        queryKey: KEYS.list(),
        queryFn: async () => {
            const res = await axios.get('/api/admin/testimonials');
            return testimonialSchema.array().parse(res.data?.data ?? []);
        },
        staleTime: 1000 * 60 * 5,
    });

export const testimonialQuery = (id: string) =>
    queryOptions({
        queryKey: KEYS.detail(id),
        queryFn: async () => {
            const res = await axios.get(`/api/admin/testimonials/${id}`);
            return testimonialSchema.parse(res.data?.data);
        },
        enabled: !!id,
        staleTime: 1000 * 60 * 5,
    });

// src/features/feedback/queries/feedbackQueries.ts
import { queryOptions } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { z } from 'zod';

/** 國家(精簡) */
export const feedbackCountrySchema = z.object({
    id: z.string(),
    name: z.string().optional(),
    nameZh: z.string().optional(),
    code: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});
export type FeedbackCountryEntity = z.infer<typeof feedbackCountrySchema>;

/** Feedback（含多國家陣列） */
export const feedbackSchema = z.object({
    id: z.string(),
    title: z.string(),
    subtitle: z.string().optional(),
    content: z.string().optional(),
    nickname: z.string(),
    imageUrl: z.string(),
    linkUrl: z.string().url(),
    linekName: z.string().optional(),
    order: z.number().int(),
    countries: z.array(feedbackCountrySchema).nullish().default([]),
    createdAt: z.string(),
    updatedAt: z.string(),
});
export type FeedbackEntity = z.infer<typeof feedbackSchema>;

/** 建立/更新用 DTO（配合 Server Actions 的 countryIds） */
export type FeedbackDTO = {
    title: string;
    subtitle?: string;
    content?: string;
    nickname: string;
    imageUrl: string;
    linkUrl: string;
    linekName?: string;
    order: number;
    countryIds?: string[];
};

export const KEYS = {
    all: ['feedbacks'] as const,
    list: () => ['feedbacks'] as const,
    detail: (id: string) => ['feedbacks', id] as const,
    byCountry: (countryId: string) =>
        ['feedbacks', 'country', countryId] as const,
};

/** Feedback 列表 */
export const feedbackListQuery = () =>
    queryOptions({
        queryKey: KEYS.list(),
        queryFn: async () => {
            const res = await axios.get('/api/admin/feedback');
            const payload = res.data?.data ?? res.data;
            return z.array(feedbackSchema).parse(payload);
        },
        staleTime: 1000 * 60 * 5,
    });

/** Feedback 單筆 */
export const feedbackDetailQuery = (id: string) =>
    queryOptions({
        queryKey: KEYS.detail(id),
        queryFn: async () => {
            const res = await axios.get(`/api/admin/feedback/${id}`);
            const payload = res.data?.data ?? res.data;
            return feedbackSchema.parse(payload);
        },
        enabled: !!id,
        staleTime: 1000 * 60 * 5,
    });

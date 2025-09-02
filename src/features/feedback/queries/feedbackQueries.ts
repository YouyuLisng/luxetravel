import axios from '@/lib/axios';
import { z } from 'zod';

// === Schema ===
export const feedbackSchema = z.object({
    id: z.string(),
    title: z.string(),
    subtitle: z.string().nullable(),
    content: z.string(),
    nickname: z.string().nullable(),
    imageUrl: z.string().nullable(),
    linkUrl: z.string().nullable(),
    linekName: z.string().nullable(),
    order: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
    countries: z
        .array(
            z.object({
                id: z.string(),
                name: z.string().nullable(),
                nameZh: z.string().nullable(),
                code: z.string().nullable(),
                createdAt: z.string(),
                updatedAt: z.string(),
            })
        )
        .default([]),
});

export type FeedbackEntity = z.infer<typeof feedbackSchema>;

// === Pagination Schema ===
export const paginationSchema = z.object({
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
    pageCount: z.number(),
});

// === Response Schema ===
export const listResponseSchema = z.object({
    rows: feedbackSchema.array(),
    pagination: paginationSchema,
});

// === Query Keys ===
export const KEYS = {
    list: (page: number, pageSize: number) =>
        ['feedbacks', page, pageSize] as const,
    detail: (id: string) => ['feedbacks', id] as const,
};

// === Queries ===
export const feedbacksQuery = (page: number, pageSize: number) => ({
    queryKey: KEYS.list(page, pageSize),
    queryFn: async () => {
        const res = await axios.get('/api/admin/feedback', {
            params: { page, pageSize },
        });
        return listResponseSchema.parse(res.data);
    },
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
});

export const feedbackQuery = (id: string) => ({
    queryKey: KEYS.detail(id),
    queryFn: async () => {
        const res = await axios.get(`/api/admin/feedback/${id}`);
        return feedbackSchema.parse(res.data.data);
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
});

import axios from '@/lib/axios';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';

// === Schema ===
export const feedbackSchema = z.object({
    id: z.string(),
    title: z.string(),
    content: z.string().nullable(),
    nickname: z.string(),
    imageUrl: z.string(),
    linkUrl: z.string(),
    productId: z.string().nullable().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
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

export const allResponseSchema = z.object({
  status: z.boolean(),
  rows: feedbackSchema.array(),
});

// === Query Keys ===
export const KEYS = {
    list: (page: number, pageSize: number) =>
        ['feedbacks', page, pageSize] as const,
    detail: (id: string) => ['feedbacks', id] as const,
    all: ['feedbacks', 'all'] as const, // ✅ 新增一個全取用的 key
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

// === 全部 Feedback（不分頁） ===
export const feedbacksAllQuery = {
    queryKey: KEYS.all,
    queryFn: async () => {
        const res = await axios.get('/api/admin/feedback/all');
        return allResponseSchema.parse(res.data).rows;
    },
    staleTime: 1000 * 60 * 10,
};

// === Hook ===
export function useFeedbacksAll() {
    return useQuery(feedbacksAllQuery);
}

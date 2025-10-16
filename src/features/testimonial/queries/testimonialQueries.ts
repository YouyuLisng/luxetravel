import axios from '@/lib/axios';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

/** === Schema === */
export const FeedbackModeZod = z.enum(['REAL', 'MARKETING']);
export type FeedbackMode = z.infer<typeof FeedbackModeZod>;

export const testimonialSchema = z.object({
    id: z.string(),
    mode: FeedbackModeZod,
    nickname: z.string().nullish(),
    stars: z.number().int().min(1).max(5).nullish(),
    content: z.string(),
    linkUrl: z.string().url().nullish(),
    imageUrl: z.string().url().nullish(),

    // ✅ color 改為物件
    color: z
        .object({
            bg: z.string(),
            text: z.string(),
        })
        .optional()
        .nullable(),

    order: z.number().int(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export type TestimonialEntity = z.infer<typeof testimonialSchema>;

export type TestimonialDTO = {
    mode: FeedbackMode;
    content: string;
    order?: number;
    nickname?: string | null;
    stars?: number | null;
    linkUrl?: string | null;
    imageUrl?: string | null;
    color?: string | null;
};
/** === Pagination Schema === */
export const paginationSchema = z.object({
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
    pageCount: z.number(),
});

/** === Response Schema === */
export const listResponseSchema = z.object({
    rows: testimonialSchema.array(),
    pagination: paginationSchema,
});

/** === Query Keys === */
export const KEYS = {
    list: (page: number, pageSize: number) =>
        ['testimonials', page, pageSize] as const,
    detail: (id: string) => ['testimonials', id] as const,
};

/** === Queries === */
export const testimonialsQuery = (page: number, pageSize: number) => ({
    queryKey: KEYS.list(page, pageSize),
    queryFn: async () => {
        const res = await axios.get('/api/admin/testimonials', {
            params: { page, pageSize },
        });
        return listResponseSchema.parse(res.data);
    },
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
});

export function useTestimonialsAll() {
    return useQuery({
        queryKey: ['testimonials', 'all'],
        queryFn: async () => {
            const res = await axios.get('/api/admin/testimonials', {
                params: { page: 1, pageSize: 999 },
            });
            return listResponseSchema.parse(res.data).rows;
        },
        staleTime: 1000 * 60 * 10,
    });
}

export const testimonialQuery = (id: string) => ({
    queryKey: KEYS.detail(id),
    queryFn: async () => {
        const res = await axios.get(`/api/admin/testimonials/${id}`);
        return testimonialSchema.parse(res.data.data);
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
});

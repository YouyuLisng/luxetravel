import axios from '@/lib/axios';
import { z } from 'zod';

// === Schema ===
export const travelArticleSchema = z.object({
    id: z.string(),
    title: z.string(),
    subtitle: z.string().nullable(),
    linkUrl: z.string().url().nullable(),
    imageUrl: z.string().nullable(),
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

export type TravelArticleEntity = z.infer<typeof travelArticleSchema>;

// === Pagination Schema ===
export const paginationSchema = z.object({
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
    pageCount: z.number(),
});

// === Response Schema ===
export const listResponseSchema = z.object({
    rows: travelArticleSchema.array(),
    pagination: paginationSchema,
});

// === Query Keys ===
export const KEYS = {
    list: (page: number, pageSize: number) =>
        ['travel-articles', page, pageSize] as const,
    detail: (id: string) => ['travel-articles', id] as const,
};

// === Queries ===
export const travelArticlesQuery = (page: number, pageSize: number) => ({
    queryKey: KEYS.list(page, pageSize),
    queryFn: async () => {
        const res = await axios.get('/api/admin/article', {
            params: { page, pageSize },
        });
        return listResponseSchema.parse(res.data);
    },
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
});

export const travelArticleQuery = (id: string) => ({
    queryKey: KEYS.detail(id),
    queryFn: async () => {
        const res = await axios.get(`/api/admin/article/${id}`);
        return travelArticleSchema.parse(res.data.data);
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
});

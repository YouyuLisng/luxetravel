import axios from '@/lib/axios';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

// === Schema ===
export const attractionSchema = z.object({
    id: z.string(),
    code: z.string().nullable(),
    nameZh: z.string(),
    nameEn: z.string(),
    content: z.string().nullable(),
    region: z.string().nullable(),
    country: z.string().nullable(),
    city: z.string().nullable(),
    tags: z.array(z.string()).default([]),
    imageUrl: z.string().nullable(),
    enabled: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export type AttractionEntity = z.infer<typeof attractionSchema>;

// === Pagination Schema ===
export const paginationSchema = z.object({
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
    pageCount: z.number(),
});

// === Response Schema ===
export const listResponseSchema = z.object({
    rows: attractionSchema.array(),
    pagination: paginationSchema,
});

// === Query Keys ===
export const KEYS = {
    list: (page: number, pageSize: number, keyword: string) =>
        ['attractions', page, pageSize, keyword] as const, // ✅ 加 keyword
    detail: (id: string) => ['attractions', id] as const,
};

// === Queries ===
export const attractionsQuery = (
    page: number,
    pageSize: number,
    keyword: string = ''
) => ({
    queryKey: KEYS.list(page, pageSize, keyword),
    queryFn: async () => {
        const res = await axios.get('/api/admin/attraction', {
            params: { page, pageSize, keyword }, // ✅ 傳 keyword 給 API
        });
        return listResponseSchema.parse(res.data);
    },
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
});

export function useAttractionsAll() {
    return useQuery({
        queryKey: ['attractions', 'all'],
        queryFn: async () => {
            const res = await axios.get('/api/admin/attraction/all');
            return listResponseSchema.parse({
                rows: res.data.data,
                pagination: res.data.pagination,
            }).rows;
        },
        staleTime: 1000 * 60 * 10,
    });
}

export const attractionQuery = (id: string) => ({
    queryKey: KEYS.detail(id),
    queryFn: async () => {
        const res = await axios.get(`/api/admin/attraction/${id}`);
        return attractionSchema.parse(res.data.data);
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
});

import axios from '@/lib/axios';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

// === Schema ===
export const pageSchema = z.object({
    id: z.string(),
    title: z.string(),
    slug: z.string(),
    content: z.string().nullable().optional(),
    seoTitle: z.string().nullable().optional(),
    seoDesc: z.string().nullable().optional(),
    seoImage: z.string().nullable().optional(),
    keywords: z.array(z.string()).default([]),

    createdAt: z.string(),
    updatedAt: z.string(),
});

export type PageEntity = z.infer<typeof pageSchema>;

// === Pagination Schema ===
export const paginationSchema = z.object({
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
    pageCount: z.number(),
});

// === Response Schema ===
export const listResponseSchema = z.object({
    rows: pageSchema.array(),
    pagination: paginationSchema,
});

// === Query Keys ===
export const KEYS = {
    list: (page: number, pageSize: number, q?: string) =>
        ['pages', page, pageSize, q] as const,
    detail: (id: string) => ['pages', id] as const,
};

// === Queries ===
export const pagesQuery = (page: number, pageSize: number, q?: string) => ({
    queryKey: KEYS.list(page, pageSize, q),
    queryFn: async () => {
        const res = await axios.get('/api/admin/pages', {
            params: { page, pageSize, q },
        });
        return listResponseSchema.parse(res.data);
    },
    placeholderData: (prev: any) => prev, // ✅ react-query v5 建議用 placeholderData 取代 keepPreviousData
    staleTime: 1000 * 60 * 5,
});

export function usePagesAll() {
    return useQuery({
        queryKey: ['pages', 'all'],
        queryFn: async () => {
            const res = await axios.get('/api/admin/pages', {
                params: { page: 1, pageSize: 999 },
            });
            return listResponseSchema.parse(res.data).rows;
        },
        staleTime: 1000 * 60 * 10,
    });
}

export const pageQuery = (id: string) => ({
    queryKey: KEYS.detail(id),
    queryFn: async () => {
        const res = await axios.get(`/api/admin/pages/${id}`);
        return pageSchema.parse(res.data.data);
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
});

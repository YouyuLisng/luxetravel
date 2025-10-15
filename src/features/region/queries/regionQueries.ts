import axios from '@/lib/axios';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

// === Schema ===
export const regionSchema = z.object({
    id: z.string(),
    code: z.string(),
    nameEn: z.string(),
    nameZh: z.string(),
    imageUrl: z.string().nullable(),
    enabled: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export type RegionEntity = z.infer<typeof regionSchema>;

// === Pagination Schema ===
export const paginationSchema = z.object({
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
    pageCount: z.number(),
});

// === Response Schema ===
export const listResponseSchema = z.object({
    rows: regionSchema.array(),
    pagination: paginationSchema,
});

// === Query Keys ===
export const KEYS = {
    list: (page: number, pageSize: number) =>
        ['regions', page, pageSize] as const,
    detail: (id: string) => ['regions', id] as const,
};

// === Queries ===
export const regionsQuery = (page: number, pageSize: number) => ({
    queryKey: KEYS.list(page, pageSize),
    queryFn: async () => {
        const res = await axios.get('/api/admin/regions', {
            params: { page, pageSize },
        });
        return listResponseSchema.parse(res.data);
    },
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
});

export function useRegions() {
    return useQuery({
        queryKey: ['regions', 'all'],
        queryFn: async () => {
            const res = await axios.get('/api/admin/regions', {
                params: { page: 1, pageSize: 999 },
            });
            return listResponseSchema.parse(res.data).rows;
        },
        staleTime: 1000 * 60 * 10,
    });
}

export const regionQuery = (id: string) => ({
    queryKey: KEYS.detail(id),
    queryFn: async () => {
        const res = await axios.get(`/api/admin/regions/${id}`);
        return regionSchema.parse(res.data.data);
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
});

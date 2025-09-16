import axios from '@/lib/axios';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
// === Schema ===
export const citySchema = z.object({
    id: z.string(),
    code: z.string(),
    nameZh: z.string(),
    nameEn: z.string(),
    country: z.string(),
    imageUrl: z.string().nullable(),
    enabled: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export type CityEntity = z.infer<typeof citySchema>;

// === Pagination Schema ===
export const paginationSchema = z.object({
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
    pageCount: z.number(),
});

// === Response Schema ===
export const listResponseSchema = z.object({
    rows: citySchema.array(),
    pagination: paginationSchema,
});

// === Query Keys ===
export const KEYS = {
    list: (page: number, pageSize: number) =>
        ['cities', page, pageSize] as const,
    detail: (id: string) => ['cities', id] as const,
};

// === Queries ===
export const citiesQuery = (page: number, pageSize: number) => ({
    queryKey: KEYS.list(page, pageSize),
    queryFn: async () => {
        const res = await axios.get('/api/admin/city', {
            params: { page, pageSize },
        });
        return listResponseSchema.parse(res.data);
    },
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
});

export function useCities() {
    return useQuery({
        queryKey: ['all'],
        queryFn: async () => {
            const res = await axios.get('/api/admin/city/all');
            return listResponseSchema.parse(res.data).rows;
        },
        staleTime: 1000 * 60 * 10,
    });
}

export const cityQuery = (id: string) => ({
    queryKey: KEYS.detail(id),
    queryFn: async () => {
        const res = await axios.get(`/api/admin/city/${id}`);
        return citySchema.parse(res.data.data);
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
});

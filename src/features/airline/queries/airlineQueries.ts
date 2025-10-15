import axios from '@/lib/axios';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

// === Schema ===
export const airlineSchema = z.object({
    id: z.string(),
    code: z.string(),
    nameZh: z.string(),
    nameEn: z.string(),
    imageUrl: z.string().nullable(),
    enabled: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
});
export type AirlineEntity = z.infer<typeof airlineSchema>;

// 分頁資訊 schema
export const paginationSchema = z.object({
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
    pageCount: z.number(),
});

export const listResponseSchema = z.object({
    rows: airlineSchema.array(),
    pagination: paginationSchema,
});

// === Keys ===
export const KEYS = {
    list: (page: number, pageSize: number) =>
        ['airlines', page, pageSize] as const,
    detail: (id: string) => ['airlines', id] as const,
};

// === Queries ===
export const airlinesQuery = (page: number, pageSize: number) => ({
    queryKey: KEYS.list(page, pageSize),
    queryFn: async () => {
        const res = await axios.get('/api/admin/airline', {
            params: { page, pageSize },
        });
        return listResponseSchema.parse(res.data);
    },
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
});

export function useAirlines() {
    return useQuery({
        queryKey: ['airlines', 'all'],
        queryFn: async () => {
            const res = await axios.get('/api/admin/airline/all');
            return listResponseSchema.parse(res.data).rows;
        },
        staleTime: 1000 * 60 * 10,
    });
}

export const airlineQuery = (id: string) => ({
    queryKey: KEYS.detail(id),
    queryFn: async () => {
        const res = await axios.get(`/api/admin/airline/${id}`);
        return airlineSchema.parse(res.data.data);
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
});

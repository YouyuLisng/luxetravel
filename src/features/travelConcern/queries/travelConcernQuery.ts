import axios from '@/lib/axios';
import { z } from 'zod';

// === Schema ===
export const travelConcernSchema = z.object({
    id: z.string(),
    moduleId: z.string(),
    number: z.string(),
    content: z.string(),
    order: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export type TravelConcernEntity = z.infer<typeof travelConcernSchema>;

// === Pagination Schema ===
export const paginationSchema = z.object({
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
    pageCount: z.number(),
});

// === Response Schema ===
export const listResponseSchema = z.object({
    rows: travelConcernSchema.array(),
    pagination: paginationSchema,
});

// === Query Keys ===
export const KEYS = {
    list: (page: number, pageSize: number) =>
        ['concerns', page, pageSize] as const,
    detail: (id: string) => ['concerns', id] as const,
};

// === Queries ===
export const travelConcernsQuery = (page: number, pageSize: number) => ({
    queryKey: KEYS.list(page, pageSize),
    queryFn: async () => {
        const res = await axios.get('/api/admin/concerns', {
            params: { page, pageSize },
        });
        return listResponseSchema.parse(res.data);
    },
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
});

export const travelConcernQuery = (id: string) => ({
    queryKey: KEYS.detail(id),
    queryFn: async () => {
        const res = await axios.get(`/api/admin/concerns/${id}`);
        return travelConcernSchema.parse(res.data.data);
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
});

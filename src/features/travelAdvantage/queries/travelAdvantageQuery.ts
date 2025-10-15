import axios from '@/lib/axios';
import { z } from 'zod';

// === Schema ===
export const travelAdvantageSchema = z.object({
    id: z.string(),
    moduleId: z.string(),
    imageUrl: z.string(),
    title: z.string(),
    content: z.string(),
    order: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
});
export type TravelAdvantageEntity = z.infer<typeof travelAdvantageSchema>;

export const paginationSchema = z.object({
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
    pageCount: z.number(),
});

export const listResponseSchema = z.object({
    rows: travelAdvantageSchema.array(),
    pagination: paginationSchema,
});

// === Keys ===
export const KEYS = {
    list: (page: number, pageSize: number) =>
        ['travel-advantages', page, pageSize] as const,
    detail: (id: string) => ['travel-advantages', id] as const,
};

// === Queries ===
export const travelAdvantagesQuery = (page: number, pageSize: number) => ({
    queryKey: KEYS.list(page, pageSize),
    queryFn: async () => {
        const res = await axios.get('/api/admin/advantages', {
            params: { page, pageSize },
        });
        return listResponseSchema.parse(res.data);
    },
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
});

export const travelAdvantageQuery = (id: string) => ({
    queryKey: KEYS.detail(id),
    queryFn: async () => {
        const res = await axios.get(`/api/admin/advantages/${id}`);
        return travelAdvantageSchema.parse(res.data.data);
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
});

// === Mutations ===
export async function createTravelAdvantage(payload: Partial<TravelAdvantageEntity>) {
    const res = await axios.post('/api/admin/advantages', payload);
    return travelAdvantageSchema.parse(res.data.data);
}

export async function updateTravelAdvantage(id: string, payload: Partial<TravelAdvantageEntity>) {
    const res = await axios.put(`/api/admin/advantages/${id}`, payload);
    return travelAdvantageSchema.parse(res.data.data);
}

export async function deleteTravelAdvantage(id: string) {
    const res = await axios.delete(`/api/admin/advantages/${id}`);
    return res.data;
}

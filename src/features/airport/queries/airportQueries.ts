import axios from '@/lib/axios';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

// === Schema ===
export const airportSchema = z.object({
    id: z.string(),
    code: z.string(),
    nameZh: z.string(),
    nameEn: z.string(),
    imageUrl: z.string().nullable(),
    enabled: z.boolean(),
    regionId: z.string(),
    countryId: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    region: z
        .object({
            id: z.string(),
            nameZh: z.string(),
            nameEn: z.string(),
        })
        .optional()
        .nullable(),
    country: z
        .object({
            id: z.string(),
            nameZh: z.string(),
            nameEn: z.string(),
            code: z.string().optional().nullable(),
        })
        .optional()
        .nullable(),
});
export type AirportEntity = z.infer<typeof airportSchema>;

// === Pagination Schema ===
export const paginationSchema = z.object({
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
    pageCount: z.number(),
});

// === Response Schema ===
export const listResponseSchema = z.object({
    rows: airportSchema.array(),
    pagination: paginationSchema,
});

// === Query Keys ===
export const KEYS = {
    list: (page: number, pageSize: number) =>
        ['airports', page, pageSize] as const,
    detail: (id: string) => ['airports', id] as const,
};

// === Queries ===
export const airportsQuery = (page: number, pageSize: number) => ({
    queryKey: KEYS.list(page, pageSize),
    queryFn: async () => {
        const res = await axios.get('/api/admin/airports', {
            params: { page, pageSize },
        });
        return listResponseSchema.parse(res.data);
    },
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
});

export function useAirports() {
    return useQuery({
        queryKey: ['airports', 'all'],
        queryFn: async () => {
            const res = await axios.get('/api/admin/airports/all');
            return listResponseSchema.parse({
                rows: res.data.data,
                pagination: res.data.pagination,
            }).rows;
        },
        staleTime: 1000 * 60 * 10,
    });
}

export const airportQuery = (id: string) => ({
    queryKey: KEYS.detail(id),
    queryFn: async () => {
        const res = await axios.get(`/api/admin/airports/${id}`);
        return airportSchema.parse(res.data.data);
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
});

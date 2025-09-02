import axios from '@/lib/axios';
import { z } from 'zod';

// === Schema ===
export const countryShowcaseSchema = z.object({
    id: z.string(),
    imageUrl: z.string(),
    title: z.string(),
    subtitle: z.string().nullable().optional(),
    description: z.string(),
    linkUrl: z.string().nullable().optional(),
    order: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export type CountryShowcaseEntity = z.infer<typeof countryShowcaseSchema>;

// === Pagination Schema ===
export const paginationSchema = z.object({
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
    pageCount: z.number(),
});

// === Response Schema ===
export const listResponseSchema = z.object({
    rows: countryShowcaseSchema.array(),
    pagination: paginationSchema,
});

// === Query Keys ===
export const KEYS = {
    list: (page: number, pageSize: number) =>
        ['country-showcases', page, pageSize] as const,
    detail: (id: string) => ['country-showcases', id] as const,
};

// === Queries ===
export const countryShowcasesQuery = (page: number, pageSize: number) => ({
    queryKey: KEYS.list(page, pageSize),
    queryFn: async () => {
        const res = await axios.get('/api/admin/country-showcases', {
            params: { page, pageSize },
        });
        return listResponseSchema.parse(res.data);
    },
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
});

export const countryShowcaseQuery = (id: string) => ({
    queryKey: KEYS.detail(id),
    queryFn: async () => {
        const res = await axios.get(`/api/admin/country-showcases/${id}`);
        return countryShowcaseSchema.parse(res.data.data);
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
});

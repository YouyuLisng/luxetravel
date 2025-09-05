import axios from '@/lib/axios';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

// === TourProduct Schema ===
export const tourProductSchema = z.object({
    id: z.string(),
    code: z.string(),
    namePrefix: z.string().nullable(),
    name: z.string(),
    mainImageUrl: z.string(),
    summary: z.string().nullable(),
    description: z.string().nullable(),
    days: z.number(),
    nights: z.number(),
    departAirport: z.string(),
    arriveCountry: z.string(),
    arriveCity: z.string(),
    arriveAirport: z.string(),
    category: z.string(),
    priceMin: z.number(),
    priceMax: z.number().nullable(),
    tags: z.array(z.string()),
    note: z.string().nullable(),
    status: z.number(),
    staff: z.string().nullable(),
    reminder: z.string().nullable(),
    policy: z.string().nullable(),
    categoryId: z.string(),
    subCategoryId: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

// === Pagination Schema ===
export const paginationSchema = z.object({
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
    pageCount: z.number(),
});

// === List Response Schema ===
export const listResponseSchema = z.object({
    rows: tourProductSchema.array(),
    pagination: paginationSchema,
});

export type TourProductEntity = z.infer<typeof tourProductSchema>;

// === Query Keys ===
export const KEYS = {
    list: (page: number, pageSize: number) =>
        ['tourProducts', page, pageSize] as const,
    detail: (id: string) => ['tourProducts', id] as const,
};

// === Queries ===
export const tourProductsQuery = (page: number, pageSize: number) => ({
    queryKey: KEYS.list(page, pageSize),
    queryFn: async () => {
        const res = await axios.get('/api/admin/product', {
            params: { page, pageSize },
        });
        return listResponseSchema.parse(res.data);
    },
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
});

/** 抓全部 TourProduct (不分頁，適合 dropdown 選單) */
export function useTourProducts() {
    return useQuery({
        queryKey: ['tourProducts', 'all'],
        queryFn: async () => {
            const res = await axios.get('/api/admin/product', {
                params: { page: 1, pageSize: 999 },
            });
            return listResponseSchema.parse(res.data).rows;
        },
        staleTime: 1000 * 60 * 10,
    });
}

/** 抓單一 TourProduct */
export const tourProductQuery = (id: string) => ({
    queryKey: KEYS.detail(id),
    queryFn: async () => {
        const res = await axios.get(`/api/admin/product/${id}`);
        return tourProductSchema.parse(res.data); 
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
});

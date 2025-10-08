import axios from '@/lib/axios';
import { z } from 'zod';

// === Schema ===
export const countryShowcaseSchema = z.object({
    id: z.string(),
    bookImage: z.string(),                     // ✅ 主圖片
    landscapeImage: z.string().nullable(),     // ✅ 風景圖片
    title: z.string(),
    subtitle: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    linkUrl: z.string().nullable().optional(),
    linkText: z.string().nullable().optional(),
    order: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),

    // ✅ 若你有回傳關聯產品，可提前定義（可省略）
    groupProducts: z
        .array(
            z.object({
                id: z.string(),
                code: z.string(),
                name: z.string(),
                category: z.string(),
                arriveCountry: z.string().nullable().optional(),
                days: z.number().optional(),
                nights: z.number().optional(),
                priceMin: z.number().optional(),
                priceMax: z.number().nullable().optional(),
                status: z.number().optional(),
            })
        )
        .optional(),
    freeProducts: z
        .array(
            z.object({
                id: z.string(),
                code: z.string(),
                name: z.string(),
                category: z.string(),
                arriveCountry: z.string().nullable().optional(),
                days: z.number().optional(),
                nights: z.number().optional(),
                priceMin: z.number().optional(),
                priceMax: z.number().nullable().optional(),
                status: z.number().optional(),
            })
        )
        .optional(),
    recoProducts: z
        .array(
            z.object({
                id: z.string(),
                code: z.string(),
                name: z.string(),
                category: z.string(),
                arriveCountry: z.string().nullable().optional(),
                days: z.number().optional(),
                nights: z.number().optional(),
                priceMin: z.number().optional(),
                priceMax: z.number().nullable().optional(),
                status: z.number().optional(),
            })
        )
        .optional(),
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
    pagination: paginationSchema, // ✅ 不再 nullable（因為後端不回傳 null）
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

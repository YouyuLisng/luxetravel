import axios from '@/lib/axios';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';

// === Schema ===
export const subCategorySchema = z.object({
    id: z.string(),
    code: z.string(),
    nameZh: z.string(),
    nameEn: z.string(),
    imageUrl: z.string().nullable(),
    enabled: z.boolean(),
    categoryId: z.string(),
    category: z
        .object({
            id: z.string(),
            nameZh: z.string(),
        })
        .nullable()
        .optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export type SubCategoryEntity = z.infer<typeof subCategorySchema>;

// === Pagination Schema ===
export const paginationSchema = z.object({
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
    pageCount: z.number(),
});

// === Response Schema ===
export const listResponseSchema = z.object({
    rows: subCategorySchema.array(),
    pagination: paginationSchema,
});

// === Query Keys ===
export const KEYS = {
    list: (page: number, pageSize: number) =>
        ['sub-categories', page, pageSize] as const,
    detail: (id: string) => ['sub-categories', id] as const,
};

// === Queries ===
export const subCategoriesQuery = (page: number, pageSize: number) => ({
    queryKey: KEYS.list(page, pageSize),
    queryFn: async () => {
        const res = await axios.get('/api/admin/subCategory', {
            params: { page, pageSize },
        });
        return listResponseSchema.parse(res.data);
    },
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
});


// === Hook: 全部列表 (for 下拉選單) ===
export function useSubCategories() {
    return useQuery({
        queryKey: ['sub-categories', 'all'],
        queryFn: async () => {
            const res = await axios.get('/api/admin/subCategory', {
                params: { page: 1, pageSize: 999 },
            });
            return listResponseSchema.parse(res.data).rows;
        },
        staleTime: 1000 * 60 * 10,
    });
}

export const subCategoryQuery = (id: string) => ({
    queryKey: KEYS.detail(id),
    queryFn: async () => {
        const res = await axios.get(`/api/admin/subCategory/${id}`);
        return subCategorySchema.parse(res.data.data);
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
});

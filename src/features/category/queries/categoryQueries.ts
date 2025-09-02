// features/category/queries/categoryQueries.ts
import { queryOptions } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { z } from 'zod';

/** ---- Zod Schemas ---- */
export const categoryDTOSchema = z.object({
    code: z.string(),
    nameEn: z.string(),
    nameZh: z.string(),
    imageUrl: z.string().nullable().optional(),
    enabled: z.boolean().optional(),
});

export const categoryEntitySchema = z.object({
    id: z.string(),
    code: z.string(),
    nameEn: z.string(),
    nameZh: z.string(),
    imageUrl: z.string().nullable(), // 實體一定有此欄（可為 null）
    enabled: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

/** ---- Types ---- */
export type CategoryDTO = z.infer<typeof categoryDTOSchema>;
export type CategoryEntity = z.infer<typeof categoryEntitySchema>;

/** ---- API base ---- */
const BASE = '/api/admin/categorys' as const;

/** ---- Query Keys ---- */
export const KEYS = {
    list: () => ['categorys'] as const,
    detail: (id: string) => ['categorys', id] as const,
};

/** ---- 小工具：統一處理後端回應 { status, message, data } ---- */
async function handleJson<T>(p: Promise<any>): Promise<T> {
    const res = await p;
    const { data } = res;
    if (!data || data.status !== true) {
        throw new Error(data?.message || 'Request failed');
    }
    return data.data as T;
}

/** =========================
 *  RESTful API Functions
 *  ========================= */
export async function getCategorys(): Promise<CategoryEntity[]> {
    const raw = await handleJson<unknown>(axios.get(BASE));
    return z.array(categoryEntitySchema).parse(raw);
}

export async function getCategory(id: string): Promise<CategoryEntity> {
    const raw = await handleJson<unknown>(axios.get(`${BASE}/${id}`));
    return categoryEntitySchema.parse(raw);
}

export async function createCategory(payload: CategoryDTO): Promise<CategoryEntity> {
    const raw = await handleJson<unknown>(axios.post(BASE, payload));
    return categoryEntitySchema.parse(raw);
}

export async function updateCategory(
    id: string,
    payload: CategoryDTO
): Promise<CategoryEntity> {
    const raw = await handleJson<unknown>(axios.put(`${BASE}/${id}`, payload));
    return categoryEntitySchema.parse(raw);
}

export async function deleteCategory(id: string): Promise<{ id: string }> {
    const raw = await handleJson<unknown>(axios.delete(`${BASE}/${id}`));
    const parsed = categoryEntitySchema.partial().parse(raw);
    return { id: parsed.id ?? id };
}

/** =========================
 *  React Query: Query Options
 *  （可在 Server/Client 共享）
 *  ========================= */
export const categorysQuery = () =>
    queryOptions({
        queryKey: KEYS.list(),
        queryFn: getCategorys,
        staleTime: 1000 * 60 * 5,
    });

export const categoryQuery = (id: string) =>
    queryOptions({
        queryKey: KEYS.detail(id),
        queryFn: () => getCategory(id),
        enabled: !!id,
        staleTime: 1000 * 60 * 5,
    });

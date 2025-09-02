// features/region/queries/regionQueries.ts
import { queryOptions } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { z } from 'zod';

/** ---- Zod Schemas ---- */
export const regionDTOSchema = z.object({
    code: z.string(),
    nameEn: z.string(),
    nameZh: z.string(),
    imageUrl: z.string().nullable().optional(),
    enabled: z.boolean().optional(),
});

export const regionEntitySchema = z.object({
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
export type RegionDTO = z.infer<typeof regionDTOSchema>;
export type RegionEntity = z.infer<typeof regionEntitySchema>;

/** ---- API base ---- */
const BASE = '/api/admin/regions' as const;

/** ---- Query Keys ---- */
export const KEYS = {
    list: () => ['regions'] as const,
    detail: (id: string) => ['regions', id] as const,
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
export async function getRegions(): Promise<RegionEntity[]> {
    const raw = await handleJson<unknown>(axios.get(BASE));
    return z.array(regionEntitySchema).parse(raw);
}

export async function getRegion(id: string): Promise<RegionEntity> {
    const raw = await handleJson<unknown>(axios.get(`${BASE}/${id}`));
    return regionEntitySchema.parse(raw);
}

export async function createRegion(payload: RegionDTO): Promise<RegionEntity> {
    const raw = await handleJson<unknown>(axios.post(BASE, payload));
    return regionEntitySchema.parse(raw);
}

export async function updateRegion(
    id: string,
    payload: RegionDTO
): Promise<RegionEntity> {
    const raw = await handleJson<unknown>(axios.put(`${BASE}/${id}`, payload));
    return regionEntitySchema.parse(raw);
}

export async function deleteRegion(id: string): Promise<{ id: string }> {
    const raw = await handleJson<unknown>(axios.delete(`${BASE}/${id}`));
    const parsed = regionEntitySchema.partial().parse(raw);
    return { id: parsed.id ?? id };
}

/** =========================
 *  React Query: Query Options
 *  （可在 Server/Client 共享）
 *  ========================= */
export const regionsQuery = () =>
    queryOptions({
        queryKey: KEYS.list(),
        queryFn: getRegions,
        staleTime: 1000 * 60 * 5,
    });

export const regionQuery = (id: string) =>
    queryOptions({
        queryKey: KEYS.detail(id),
        queryFn: () => getRegion(id),
        enabled: !!id,
        staleTime: 1000 * 60 * 5,
    });

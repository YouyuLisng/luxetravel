// features/banner/queries/bannerQueries.ts
import { queryOptions } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { z } from 'zod';

/** ---- Zod Schemas ---- */
export const bannerDTOSchema = z.object({
    imageUrl: z.string(),
    title: z.string(),
    subtitle: z.string().nullable().optional(),
    linkText: z.string().nullable().optional(),
    linkUrl: z.string().nullable().optional(),
    order: z.number().nullable().optional(),
});

export const bannerEntitySchema = bannerDTOSchema.extend({
    id: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

/** ---- Types ---- */
export type BannerDTO = z.infer<typeof bannerDTOSchema>;
export type BannerEntity = z.infer<typeof bannerEntitySchema>;

/** ---- API base ---- */
const BASE = '/api/admin/banners' as const;

/** ---- Query Keys ---- */
export const KEYS = {
    list: () => ['banners'] as const,
    detail: (id: string) => ['banners', id] as const,
};

/** ---- 小工具：統一處理後端回應 { status, message, data } ---- */
async function handleJson<T>(p: Promise<any>): Promise<T> {
    const res = await p;
    const { data } = res;
    if (!data || data.status !== true) {
        // 後端若有 message 就丟出，便於 toast 顯示
        throw new Error(data?.message || 'Request failed');
    }
    return data.data as T;
}

/** =========================
 *  RESTful API Functions
 *  ========================= */
export async function getBanners(): Promise<BannerEntity[]> {
    const raw = await handleJson<unknown>(axios.get(BASE));
    // 後端 data 可能是 Array
    return z.array(bannerEntitySchema).parse(raw);
}

export async function getBanner(id: string): Promise<BannerEntity> {
    const raw = await handleJson<unknown>(axios.get(`${BASE}/${id}`));
    return bannerEntitySchema.parse(raw);
}

export async function createBanner(payload: BannerDTO): Promise<BannerEntity> {
    const raw = await handleJson<unknown>(axios.post(BASE, payload));
    return bannerEntitySchema.parse(raw);
}

export async function updateBanner(
    id: string,
    payload: BannerDTO
): Promise<BannerEntity> {
    const raw = await handleJson<unknown>(axios.put(`${BASE}/${id}`, payload));
    return bannerEntitySchema.parse(raw);
}

export async function deleteBanner(id: string): Promise<{ id: string }> {
    const raw = await handleJson<unknown>(axios.delete(`${BASE}/${id}`));
    // 有些 API 會回刪除的 id，有些回整個物件；這裡統一轉成 { id }
    const parsed = bannerEntitySchema.partial().parse(raw);
    return { id: parsed.id ?? id };
}

/** =========================
 *  React Query: Query Options
 *  （可在 Server/Client 共享）
 *  ========================= */
export const bannersQuery = () =>
    queryOptions({
        queryKey: KEYS.list(),
        queryFn: getBanners,
        staleTime: 1000 * 60 * 5,
    });

export const bannerQuery = (id: string) =>
    queryOptions({
        queryKey: KEYS.detail(id),
        queryFn: () => getBanner(id),
        enabled: !!id,
        staleTime: 1000 * 60 * 5,
    });

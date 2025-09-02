// features/attraction/queries/attractionQueries.ts
'use client';

import { queryOptions } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { z } from 'zod';

/** 景點實體（與 Prisma 對齊） */
export const attractionSchema = z.object({
    id: z.string(),
    code: z.string().nullable().optional(), // String?
    nameZh: z.string(),
    nameEn: z.string(),
    content: z.string(),
    region: z.string(),
    country: z.string(),
    city: z.string().nullable().optional(), // String?
    tags: z.array(z.string()).nullish().default([]), // ← 要輸出 tags 陣列
    imageUrl: z.string().nullable().optional(), // String?
    enabled: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
});
export type AttractionEntity = z.infer<typeof attractionSchema>;

/** 建立/更新用 DTO（配合 Server 行為；部分欄位可省略） */
export type AttractionDTO = {
    code?: string | null;
    nameZh: string;
    nameEn: string;
    content: string;
    region: string;
    country: string;
    city?: string | null;
    tags?: string[]; // 若未傳，後端預設 []
    imageUrl?: string | null;
    enabled?: boolean; // 若未傳，後端預設 true
};

export const KEYS = {
    all: ['attractions'] as const,
    list: () => ['attractions'] as const,
    detail: (id: string) => ['attractions', id] as const,
    byCountry: (country: string) =>
        ['attractions', 'country', country] as const, // 可選
    byRegion: (region: string) => ['attractions', 'region', region] as const, // 可選
};

/** 小工具：兼容有/沒有 {status, data} 包裝的回應 */
function unwrap<T = unknown>(res: any): T {
    const payload = res?.data;
    if (payload && typeof payload === 'object' && 'status' in payload) {
        if (!payload.status)
            throw new Error(payload?.message || 'Request failed');
        return payload.data as T;
    }
    return payload as T;
}

/** 列表 */
export const attractionsQuery = () =>
    queryOptions({
        queryKey: KEYS.list(),
        queryFn: async () => {
            const res = await axios.get('/api/admin/attraction');
            const payload = unwrap<unknown>(res);
            return z.array(attractionSchema).parse(payload);
        },
        staleTime: 1000 * 60 * 5,
    });

/** 單筆 */
export const attractionQuery = (id: string) =>
    queryOptions({
        queryKey: KEYS.detail(id),
        queryFn: async () => {
            const res = await axios.get(`/api/admin/attraction/${id}`);
            const payload = unwrap<unknown>(res);
            return attractionSchema.parse(payload);
        },
        enabled: !!id,
        staleTime: 1000 * 60 * 5,
    });

/** 建立 */
export async function createAttraction(
    payload: AttractionDTO
): Promise<AttractionEntity> {
    const res = await axios.post('/api/admin/attraction', payload);
    const raw = unwrap<unknown>(res);
    return attractionSchema.parse(raw);
}

/** 更新（部分更新即可） */
export async function updateAttraction(
    id: string,
    payload: Partial<AttractionDTO>
): Promise<AttractionEntity> {
    const res = await axios.put(`/api/admin/attraction/${id}`, payload);
    const raw = unwrap<unknown>(res);
    return attractionSchema.parse(raw);
}

/** 刪除（允許後端只回 id 或整筆） */
export async function deleteAttraction(id: string): Promise<{ id: string }> {
    const res = await axios.delete(`/api/admin/attraction/${id}`);
    const raw = unwrap<unknown>(res);
    const parsed = attractionSchema.partial().parse(raw ?? {});
    return { id: parsed.id ?? id };
}

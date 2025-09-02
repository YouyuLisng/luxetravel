// features/travelConcern/queries/travelConcernQueries.ts
import axios from '@/lib/axios';
import { z } from 'zod';

export const travelConcernSchema = z.object({
    id: z.string(),
    moduleId: z.string(),
    number: z.string(), // '01' ~ '05'
    content: z.string(),
    order: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export type TravelConcernEntity = z.infer<typeof travelConcernSchema>;

/** ✅ Query Key 工廠 */
export const KEYS = {
    all: ['travel-concerns'] as const,
    list: () => ['travel-concerns'] as const,
    detail: (id: string) => ['travel-concerns', id] as const,
    byModule: (moduleId: string) =>
        ['travel-concerns', 'module', moduleId] as const,
};

/** 取得全部 TravelConcern（可選擇 moduleId 過濾） */
export const travelConcernsQuery = (opts?: { moduleId?: string }) => ({
    queryKey: opts?.moduleId ? KEYS.byModule(opts.moduleId) : KEYS.list(),
    queryFn: async () => {
        const url = opts?.moduleId
            ? `/api/admin/concerns?moduleId=${encodeURIComponent(opts.moduleId)}`
            : `/api/admin/concerns`;
        const res = await axios.get(url);
        return travelConcernSchema.array().parse(res.data.data);
    },
    staleTime: 1000 * 60 * 5,
});

/** 取得單筆 TravelConcern */
export const travelConcernQuery = (id: string) => ({
    queryKey: KEYS.detail(id),
    queryFn: async () => {
        const res = await axios.get(`/api/admin/concerns/${id}`);
        return travelConcernSchema.parse(res.data.data);
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
});

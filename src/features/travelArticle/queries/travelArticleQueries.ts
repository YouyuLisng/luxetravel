import { queryOptions } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { z } from 'zod';

/** 國家(精簡) */
const articleCountrySchema = z.object({
    id: z.string(),
    name: z.string().optional(),
    nameZh: z.string().optional(),
    code: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});

/** 文章（含多國家陣列） */
export const travelArticleSchema = z.object({
    id: z.string(),
    title: z.string(),
    subtitle: z.string(),
    linkUrl: z.string().url(),
    imageUrl: z.string(),
    countries: z.array(articleCountrySchema).nullish().default([]),
    createdAt: z.string(),
    updatedAt: z.string(),
});
export type TravelArticleEntity = z.infer<typeof travelArticleSchema>;

/** 建立/更新用 DTO（配合 Server Actions 的 countryIds） */
export type TravelArticleDTO = {
    title: string;
    subtitle: string;
    linkUrl: string;
    imageUrl: string;
    countryIds: string[];
};

export const KEYS = {
    all: ['articles'] as const,
    list: () => ['articles'] as const,
    detail: (id: string) => ['articles', id] as const,
    byCountry: (countryId: string) =>
        ['articles', 'country', countryId] as const, // 可選
};

/** 文章列表 */
export const travelArticlesQuery = () =>
    queryOptions({
        queryKey: KEYS.list(),
        queryFn: async () => {
            const res = await axios.get('/api/admin/article');
            const payload = res.data?.data ?? res.data; // 後端包 {status, data} 時取 data
            return z.array(travelArticleSchema).parse(payload);
        },
        staleTime: 1000 * 60 * 5,
    });

/** 文章單筆 */
export const travelArticleQuery = (id: string) =>
    queryOptions({
        queryKey: KEYS.detail(id),
        queryFn: async () => {
            const res = await axios.get(`/api/admin/article/${id}`);
            const payload = res.data?.data ?? res.data;
            return travelArticleSchema.parse(payload);
        },
        enabled: !!id,
        staleTime: 1000 * 60 * 5,
    });

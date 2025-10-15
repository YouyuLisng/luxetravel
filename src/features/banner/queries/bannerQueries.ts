import axios from '@/lib/axios';
import { z } from 'zod';

// === Schema ===
export const bannerSchema = z.object({
    id: z.string(),
    imageUrl: z.string(),
    title: z.string(),
    subtitle: z.string().nullable().optional(),
    linkText: z.string().nullable().optional(),
    linkUrl: z.string().nullable().optional(),
    order: z.number().default(0),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export type BannerEntity = z.infer<typeof bannerSchema>;

// === Pagination Schema ===
export const paginationSchema = z.object({
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
    pageCount: z.number(),
});

// === Response Schema ===
export const listResponseSchema = z.object({
    rows: bannerSchema.array(),
    pagination: paginationSchema,
});

// === Query Keys ===
export const KEYS = {
    list: (page: number, pageSize: number) =>
        ['banners', page, pageSize] as const,
    detail: (id: string) => ['banners', id] as const,
};

// === Queries ===
export const bannersQuery = (page: number, pageSize: number) => ({
    queryKey: KEYS.list(page, pageSize),
    queryFn: async () => {
        const res = await axios.get('/api/admin/banners', {
            params: { page, pageSize },
        });
        return listResponseSchema.parse(res.data);
    },
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
});

export const bannerQuery = (id: string) => ({
    queryKey: KEYS.detail(id),
    queryFn: async () => {
        const res = await axios.get(`/api/admin/banners/${id}`);
        return bannerSchema.parse(res.data.data);
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
});

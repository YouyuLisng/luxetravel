import axios from '@/lib/axios';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

// === Schema ===
export const lexiconSchema = z.object({
    id: z.string(),
    title: z.string(),
    type: z.string(),
    context: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export type LexiconEntity = z.infer<typeof lexiconSchema>;

// === Pagination Schema ===
export const paginationSchema = z.object({
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
    pageCount: z.number(),
});

// === Response Schema ===
export const listResponseSchema = z.object({
    rows: lexiconSchema.array(),
    pagination: paginationSchema,
});

// === Query Keys ===
export const KEYS = {
    list: (page: number, pageSize: number) =>
        ['lexicons', page, pageSize] as const,
    detail: (id: string) => ['lexicons', id] as const,
};

export function useLexicons(params?: { type?: string }) {
    return useQuery({
        queryKey: ['lexicons', 'all', params?.type],
        queryFn: async () => {
            const res = await axios.get('/api/admin/lexicon', {
                params: { page: 1, pageSize: 999, type: params?.type },
            });
            return listResponseSchema.parse(res.data).rows;
        },
        staleTime: 1000 * 60 * 10,
    });
}

// === Queries ===
export const lexiconsQuery = (
    page: number,
    pageSize: number,
    type?: string
) => ({
    queryKey: type
        ? [...KEYS.list(page, pageSize), type]
        : KEYS.list(page, pageSize),
    queryFn: async () => {
        const res = await axios.get('/api/admin/lexicon', {
            params: { page, pageSize, type },
        });
        return listResponseSchema.parse(res.data);
    },
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
});

export const lexiconQuery = (id: string) => ({
    queryKey: KEYS.detail(id),
    queryFn: async () => {
        const res = await axios.get(`/api/admin/lexicon/${id}`);
        return lexiconSchema.parse(res.data.data);
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
});

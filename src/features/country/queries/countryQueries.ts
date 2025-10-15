'use client';

import axios from '@/lib/axios';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';

// === Schema ===
export const countrySchema = z.object({
    id: z.string(),
    code: z.string(),
    nameZh: z.string(),
    nameEn: z.string(),
    imageUrl: z.string().nullable(),
    enabled: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export type CountryEntity = z.infer<typeof countrySchema>;

export const paginationSchema = z.object({
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
    pageCount: z.number(),
});

// === Response Schema (符合 API) ===
export const apiResponseSchema = z.object({
    data: countrySchema.array(),
    pagination: paginationSchema,
});

export const listResponseSchema = z.object({
    rows: countrySchema.array(),
    pagination: paginationSchema,
});

// === Query Keys ===
export const KEYS = {
    all: ['countries'] as const,
    list: (page: number, pageSize: number) =>
        [...KEYS.all, 'list', page, pageSize] as const,
    detail: (id: string) => [...KEYS.all, 'detail', id] as const,
};

// === Queries ===
/** 分頁查詢 Country */
export const countriesQuery = (page: number, pageSize: number) => ({
    queryKey: KEYS.list(page, pageSize),
    queryFn: async () => {
        const res = await axios.get('/api/admin/countries', {
            params: { page, pageSize },
        });
        const parsed = apiResponseSchema.parse(res.data);
        return {
            rows: parsed.data,
            pagination: parsed.pagination,
        };
    },
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
});

/** 抓全部 Country（無分頁） */
export function useCountriesAll() {
    return useQuery({
        queryKey: [...KEYS.all, 'all'],
        queryFn: async () => {
            const res = await axios.get('/api/admin/countries/all');
            const parsed = apiResponseSchema.parse(res.data);
            return parsed.data;
        },
        staleTime: 1000 * 60 * 10,
    });
}

/** 抓單一 Country */
export const countryQuery = (id: string) => ({
    queryKey: KEYS.detail(id),
    queryFn: async () => {
        const res = await axios.get(`/api/admin/countries/${id}`);
        // 單筆回傳結構推測是 { data: {...} }
        return countrySchema.parse(res.data.data);
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
});

import axios from '@/lib/axios';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

/* ========================= Schemas ========================= */

// === Feedback 簡單 Schema（for 關聯用） ===
export const feedbackSchema = z.object({
  id: z.string(),
  title: z.string(),
  nickname: z.string().nullable(),
  imageUrl: z.string().nullable(),
  linkUrl: z.string().nullable(),
});

// === TourProduct Schema ===
export const tourProductSchema = z.object({
  id: z.string(),
  code: z.string(),
  namePrefix: z.string().nullable(),
  name: z.string(),
  mainImageUrl: z.string(),
  summary: z.string().nullable(),
  description: z.string().nullable(),
  days: z.number(),
  nights: z.number(),
  departAirport: z.string(),
  arriveCountry: z.string(),
  arriveCity: z.string(),
  arriveAirport: z.string(),
  category: z.string(),
  priceMin: z.number(),
  priceMax: z.number().nullable(),
  tags: z.array(z.string()),
  countries: z.array(z.string()).optional().default([]),
  note: z.string().nullable(),
  status: z.number(),
  staff: z.string().nullable(),
  reminder: z.string().nullable(),
  policy: z.string().nullable(),
  categoryId: z.string(),
  subCategoryId: z.string().nullable(),
  isFeatured: z.boolean().default(false),
  feedbackId: z.string().nullable(),
  feedback: feedbackSchema.nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// === Pagination Schema ===
export const paginationSchema = z.object({
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
  pageCount: z.number(),
});

// === List Response Schema ===
export const listResponseSchema = z.object({
  rows: tourProductSchema.array(),
  pagination: paginationSchema,
});

export type TourProductEntity = z.infer<typeof tourProductSchema>;

/* ========================= Search Schemas ========================= */

export const tourProductSearchSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  days: z.number(),
  nights: z.number(),
  category: z.string(),
  priceMin: z.number(),
  priceMax: z.number().nullable(),
  status: z.number(),
  isFeatured: z.boolean(),
});

export const searchResponseSchema = z.object({
  rows: tourProductSearchSchema.array(),
});

export type TourProductSearchEntity = z.infer<typeof tourProductSearchSchema>;

/* ========================= Query Keys ========================= */

export const KEYS = {
  list: (page: number, pageSize: number, type?: string) =>
    ['tourProducts', page, pageSize, type] as const,
  detail: (id: string) => ['tourProducts', id] as const,
  search: (q: string) => ['tourProducts', 'search', q] as const,
};

/* ========================= Queries ========================= */

/**
 * 分頁查詢 TourProduct
 * @param page 第幾頁
 * @param pageSize 每頁筆數
 * @param type 產品類型 (GROUP | FREE | RECO)
 */
export const tourProductsQuery = (page: number, pageSize: number, type?: string) => ({
  queryKey: KEYS.list(page, pageSize, type),
  queryFn: async () => {
    const res = await axios.get('/api/admin/product', {
      params: { page, pageSize, ...(type ? { type } : {}) },
    });
    return listResponseSchema.parse(res.data);
  },
  keepPreviousData: true,
  staleTime: 1000 * 60 * 5,
});

/** 抓全部 TourProduct (不分頁，可指定類型) */
export function useTourProducts(type?: string) {
  return useQuery({
    queryKey: ['tourProducts', 'all', type],
    queryFn: async () => {
      const res = await axios.get('/api/admin/product', {
        params: { page: 1, pageSize: 999, ...(type ? { type } : {}) },
      });
      return listResponseSchema.parse(res.data).rows;
    },
    staleTime: 1000 * 60 * 10,
  });
}

/** 抓單一 TourProduct */
export const tourProductQuery = (id: string) => ({
  queryKey: KEYS.detail(id),
  queryFn: async () => {
    const res = await axios.get(`/api/admin/product/${id}`);
    return tourProductSchema.parse(res.data);
  },
  enabled: !!id,
  staleTime: 1000 * 60 * 5,
});

/** 搜尋 TourProduct (關鍵字) */
export const tourProductSearchQuery = (q: string) => ({
  queryKey: KEYS.search(q),
  queryFn: async () => {
    if (!q.trim()) return [];
    const res = await axios.get('/api/admin/product/search', { params: { q } });
    return searchResponseSchema.parse(res.data).rows;
  },
  enabled: !!q.trim(),
  staleTime: 1000 * 60 * 1,
});

/** Hook: 搜尋 TourProduct */
export function useTourProductSearch(q: string) {
  return useQuery(tourProductSearchQuery(q));
}

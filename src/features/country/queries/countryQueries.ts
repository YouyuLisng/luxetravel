'use client';

import { useQuery } from '@tanstack/react-query';

export const KEYS = {
  all: ['countries'] as const,
  list: (page: number, pageSize: number) =>
    [...KEYS.all, 'list', page, pageSize] as const,
  detail: (id: string) => [...KEYS.all, 'detail', id] as const,
};

export type CountriesResponse = {
  rows: any[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    pageCount: number;
  };
};

/** 抓分頁 Country */
export async function fetchCountries(
  page = 1,
  pageSize = 10
): Promise<CountriesResponse> {
  const res = await fetch(
    `/api/admin/countries?page=${page}&pageSize=${pageSize}`
  );
  if (!res.ok) throw new Error('無法取得 Country 列表');
  const json = await res.json();
  return {
    rows: json.data ?? [],
    pagination: json.pagination,
  };
}

/** 抓單一 Country */
export async function fetchCountry(id: string) {
  const res = await fetch(`/api/admin/countries/${id}`);
  if (!res.ok) throw new Error('無法取得 Country 資料');
  const json = await res.json();
  return json.data;
}

/** Hook: 分頁 Country */
export function useCountries(page = 1, pageSize = 10) {
  return useQuery<CountriesResponse>({
    queryKey: KEYS.list(page, pageSize),
    queryFn: () => fetchCountries(page, pageSize),
    placeholderData: (prev) => prev, // 👈 React Query v5 用法
  });
}

/** Hook: 單一 Country */
export function useCountryDetail(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => fetchCountry(id),
    enabled: !!id,
  });
}

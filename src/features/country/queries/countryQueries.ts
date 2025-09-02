'use client';

import { useQuery } from '@tanstack/react-query';

export const KEYS = {
    all: ['countries'] as const,
    list: () => [...KEYS.all, 'list'] as const,
    detail: (id: string) => [...KEYS.all, 'detail', id] as const,
};

/** 抓全部 Country */
export async function fetchCountries() {
    const res = await fetch('/api/admin/countries');
    if (!res.ok) throw new Error('無法取得 Country 列表');
    const json = await res.json();
    return json.data ?? [];
}

/** 抓單一 Country */
export async function fetchCountry(id: string) {
    const res = await fetch(`/api/admin/countries/${id}`);
    if (!res.ok) throw new Error('無法取得 Country 資料');
    const json = await res.json();
    return json.data;
}

/** Hook: 全部 Country */
export function useCountries() {
    return useQuery({
        queryKey: KEYS.list(),
        queryFn: fetchCountries,
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

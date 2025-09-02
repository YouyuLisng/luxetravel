'use client';

import { useQuery } from '@tanstack/react-query';

export const KEYS = {
    all: ['cities'] as const,
    list: () => [...KEYS.all, 'list'] as const,
    detail: (id: string) => [...KEYS.all, 'detail', id] as const,
};

/** 抓全部 City */
export async function fetchCities() {
    const res = await fetch('/api/admin/city');
    if (!res.ok) throw new Error('無法取得 City 列表');
    const json = await res.json();
    return json.data ?? []; // ✅ 只回傳陣列
}

/** 抓單一 City */
export async function fetchCity(id: string) {
    const res = await fetch(`/api/admin/city/${id}`);
    if (!res.ok) throw new Error('無法取得 City 資料');
    return res.json();
}

/** Hook: 全部 City */
export function useCities() {
    return useQuery({
        queryKey: KEYS.list(),
        queryFn: fetchCities,
    });
}

/** Hook: 單一 City */
export function useCity(id: string) {
    return useQuery({
        queryKey: KEYS.detail(id),
        queryFn: () => fetchCity(id),
        enabled: !!id,
    });
}

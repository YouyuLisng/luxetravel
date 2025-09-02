'use client';

import { useQuery } from '@tanstack/react-query';

export const KEYS = {
    all: ['airlines'] as const,
    list: () => [...KEYS.all, 'list'] as const,
    detail: (id: string) => [...KEYS.all, 'detail', id] as const,
};

/** 抓全部 Airline */
export async function fetchAirlines() {
    const res = await fetch('/api/admin/airline');
    if (!res.ok) throw new Error('無法取得 Airline 列表');
    return res.json();
}

/** 抓單一 Airline */
export async function fetchAirline(id: string) {
    const res = await fetch(`/api/admin/airline/${id}`);
    if (!res.ok) throw new Error('無法取得 Airline 資料');
    return res.json();
}

/** Hook: 全部 Airline */
export function useAirlines() {
    return useQuery({
        queryKey: KEYS.list(),
        queryFn: fetchAirlines,
    });
}

/** Hook: 單一 Airline */
export function useAirline(id: string) {
    return useQuery({
        queryKey: KEYS.detail(id),
        queryFn: () => fetchAirline(id),
        enabled: !!id,
    });
}

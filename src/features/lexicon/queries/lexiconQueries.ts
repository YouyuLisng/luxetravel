'use client';

import { useQuery } from '@tanstack/react-query';

export const KEYS = {
    all: ['lexicons'] as const,
    list: (params?: Record<string, string>) =>
        [...KEYS.all, 'list', params ? JSON.stringify(params) : 'all'] as const,
    detail: (id: string) => [...KEYS.all, 'detail', id] as const,
};

/** 抓全部 Lexicon，可帶篩選參數 */
export async function fetchLexicons(params?: Record<string, string>) {
    const query = params
        ? '?' +
          new URLSearchParams(
              Object.fromEntries(
                  Object.entries(params).filter(([_, v]) => v) // 過濾掉空值
              )
          ).toString()
        : '';

    const res = await fetch(`/api/admin/lexicon${query}`, {
        cache: 'no-store',
    });
    if (!res.ok) throw new Error('無法取得 Lexicon 列表');
    const json = await res.json();
    return json.data ?? [];
}

/** 抓單一 Lexicon */
export async function fetchLexicon(id: string) {
    const res = await fetch(`/api/admin/lexicon/${id}`, {
        cache: 'no-store',
    });
    if (!res.ok) throw new Error('無法取得 Lexicon 資料');
    const json = await res.json();
    return json.data ?? null;
}

/** Hook: 全部 Lexicon（可帶篩選參數） */
export function useLexicons(params?: Record<string, string>) {
    return useQuery({
        queryKey: KEYS.list(params),
        queryFn: () => fetchLexicons(params),
    });
}

/** Hook: 單一 Lexicon */
export function useLexicon(id?: string) {
    return useQuery({
        queryKey: id ? KEYS.detail(id) : ['lexicons', 'detail', 'empty'],
        queryFn: () => (id ? fetchLexicon(id) : null),
        enabled: !!id,
    });
}

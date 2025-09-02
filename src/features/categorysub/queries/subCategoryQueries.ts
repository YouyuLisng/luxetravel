'use client';

import { useQuery } from '@tanstack/react-query';

export interface SubCategory {
    id: string;
    code: string;
    nameZh: string;
    nameEn: string;
    imageUrl?: string | null;
    enabled: boolean;
    categoryId: string;
    createdAt: string;
    updatedAt: string;
}

export const KEYS = {
    all: ['subCategories'] as const,
    list: (categoryId?: string) =>
        categoryId
            ? ([...KEYS.all, 'list', categoryId] as const)
            : ([...KEYS.all, 'list'] as const),
    detail: (id: string) => [...KEYS.all, 'detail', id] as const,
};

/** 抓全部 SubCategory（可選 categoryId 過濾） */
export async function fetchSubCategories(
    categoryId?: string
): Promise<SubCategory[]> {
    const url = categoryId
        ? `/api/admin/subCategory?categoryId=${categoryId}`
        : `/api/admin/subCategory`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('無法取得 SubCategory 列表');
    const json = await res.json();
    return json.data ?? [];
}

/** 抓單一 SubCategory */
export async function fetchSubCategory(id: string): Promise<SubCategory> {
    const res = await fetch(`/api/admin/subCategory/${id}`);
    if (!res.ok) throw new Error('無法取得 SubCategory 資料');
    const json = await res.json();
    return json.data ?? [];
}

/** Hook: 全部 SubCategory */
export function useSubCategories(categoryId?: string) {
    return useQuery({
        queryKey: KEYS.list(categoryId),
        queryFn: () => fetchSubCategories(categoryId),
    });
}

/** Hook: 單一 SubCategory */
export function useSubCategory(id: string) {
    return useQuery({
        queryKey: KEYS.detail(id),
        queryFn: () => fetchSubCategory(id),
        enabled: !!id,
    });
}

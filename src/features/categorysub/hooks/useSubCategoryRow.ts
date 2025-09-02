'use client';

import { useMemo } from 'react';
import { useSubCategoriesQuery } from './useSubCategory';

/** Hook: 將 SubCategory 列表整理成 table row */
export default function useSubCategoryRow(categoryId?: string) {
    const { data, isLoading, isError, refetch } =
        useSubCategoriesQuery(categoryId);

    const rows = useMemo(() => {
        if (!data) return [];
        return (data as any[]).map((sub) => ({
            id: sub.id,
            code: sub.code,
            nameZh: sub.nameZh,
            nameEn: sub.nameEn,
            imageUrl: sub.imageUrl,
            enabled: sub.enabled,
            categoryName: sub.category?.nameZh ?? '-',
            createdAt: sub.createdAt,
        }));
    }, [data]);

    return {
        rows,
        isLoading,
        isError,
        refetch,
    };
}

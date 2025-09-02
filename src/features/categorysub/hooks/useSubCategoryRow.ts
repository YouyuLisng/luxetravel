'use client';

import { useQuery } from '@tanstack/react-query';
import { subCategoriesQuery } from '@/features/categorysub/queries/subCategoryQueries';

/** 取得 SubCategory 列表（分頁版） */
export default function useSubCategoryRow(page: number, pageSize: number) {
    const { data, isLoading, isError, error, refetch } = useQuery(
        subCategoriesQuery(page, pageSize)
    );

    return {
        rows: data?.rows ?? [],
        pagination: data?.pagination,
        isLoading,
        isError,
        error,
        refetch,
    };
}

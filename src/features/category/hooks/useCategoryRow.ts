'use client';

import { useQuery } from '@tanstack/react-query';
import { categoriesQuery } from '@/features/category/queries/categoryQueries';

/** 取得 Category 列表（分頁版） */
export default function useCategoryRow(page: number, pageSize: number) {
    const { data, isLoading, isError, error, refetch } = useQuery(
        categoriesQuery(page, pageSize)
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

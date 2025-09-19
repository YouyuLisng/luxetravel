'use client';

import { useQuery } from '@tanstack/react-query';
import { pagesQuery } from '@/features/page/queries/pageQueries';

/** 取得 Page 列表（分頁版） */
export default function usePageRow(page: number, pageSize: number, q?: string) {
    const { data, isLoading, isError, error, refetch } = useQuery(
        pagesQuery(page, pageSize, q)
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

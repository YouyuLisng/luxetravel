'use client';

import { useQuery } from '@tanstack/react-query';
import { regionsQuery } from '@/features/region/queries/regionQueries';

/** 取得 Region 列表（分頁版） */
export default function useRegionRow(page: number, pageSize: number) {
    const { data, isLoading, isError, error, refetch } = useQuery(
        regionsQuery(page, pageSize)
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

'use client';

import { useQuery } from '@tanstack/react-query';
import { attractionsQuery } from '@/features/attraction/queries/attractionQueries';

/** 取得 Attraction 列表（分頁版） */
export default function useAttractionRow(page: number, pageSize: number) {
    const { data, isLoading, isError, error, refetch } = useQuery(
        attractionsQuery(page, pageSize)
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

'use client';

import { useQuery } from '@tanstack/react-query';
import { citiesQuery } from '@/features/city/queries/cityQueries';

/** 取得 City 列表（分頁版） */
export default function useCityRow(page: number, pageSize: number) {
    const { data, isLoading, isError, error, refetch } = useQuery(
        citiesQuery(page, pageSize)
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

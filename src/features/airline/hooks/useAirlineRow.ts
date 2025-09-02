'use client';

import { useQuery } from '@tanstack/react-query';
import { airlinesQuery } from '@/features/airline/queries/airlineQueries';

/** 取得 Airline 列表（分頁版） */
export default function useAirlineRow(page: number, pageSize: number) {
    const { data, isLoading, isError, error, refetch } = useQuery(
        airlinesQuery(page, pageSize)
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

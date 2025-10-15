'use client';

import { useQuery } from '@tanstack/react-query';
import { airportsQuery } from '@/features/airport/queries/airportQueries';

/** 取得 Airport 列表（分頁版） */
export default function useAirportRow(page: number, pageSize: number) {
    const { data, isLoading, isError, error, refetch } = useQuery(
        airportsQuery(page, pageSize)
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

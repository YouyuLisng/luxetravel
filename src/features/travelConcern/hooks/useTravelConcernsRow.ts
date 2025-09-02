'use client';

import { useQuery } from '@tanstack/react-query';
import { travelConcernsQuery } from '@/features/travelConcern/queries/travelConcernQuery';

/** 取得 TravelConcern 列表（分頁版） */
export default function useTravelConcernRow(page: number, pageSize: number) {
    const { data, isLoading, isError, error, refetch } = useQuery(
        travelConcernsQuery(page, pageSize)
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

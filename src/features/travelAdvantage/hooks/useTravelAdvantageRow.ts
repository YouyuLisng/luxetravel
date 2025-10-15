'use client';

import { useQuery } from '@tanstack/react-query';
import { KEYS, travelAdvantagesQuery } from '@/features/travelAdvantage/queries/travelAdvantageQuery';

/** 取得 Advantage 列表（分頁版） */
export default function useTravelAdvantageRow(page: number, pageSize: number) {
    const { data, isLoading, isError, error, refetch } = useQuery(
        travelAdvantagesQuery(page, pageSize)
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

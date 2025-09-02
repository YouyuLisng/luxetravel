'use client';

import { useQuery } from '@tanstack/react-query';
import { airportsQuery, KEYS } from '../queries/airportQueries';

/** Hook: 取得 Airport 列表 */
export default function useAirport(params?: {
    page?: number;
    pageSize?: number;
}) {
    const { data, isLoading, isError, error, refetch } = useQuery(
        airportsQuery(params)
    );

    return {
        rows: data?.data ?? [], // 從 { data, pagination } 取出 data
        pagination: data?.pagination, // 如果要分頁資訊
        isLoading,
        isError,
        error,
        refetch,
    };
}

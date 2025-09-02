'use client';

import { useQuery } from '@tanstack/react-query';
import { KEYS, fetchAirlines } from '../queries/airlineQueries';

/** Hook: 取得 Airline 列表 */
export default function useAirline() {
    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: KEYS.list(),
        queryFn: fetchAirlines,
    });

    return {
        rows: data ?? [],
        isLoading,
        isError,
        error,
        refetch,
    };
}

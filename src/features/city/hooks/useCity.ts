'use client';

import { useQuery } from '@tanstack/react-query';
import { KEYS, fetchCities } from '../queries/cityQueries';

/** Hook: 取得 City 列表 */
export default function useCity() {
    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: KEYS.list(),
        queryFn: fetchCities,
    });

    return {
        rows: data ?? [],
        isLoading,
        isError,
        error,
        refetch,
    };
}

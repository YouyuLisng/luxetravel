'use client';

import { useQuery } from '@tanstack/react-query';
import {
    KEYS,
    fetchCountries,
} from '@/features/country/queries/countryQueries';

/** Hook: 取得 Country 列表 */
export default function useCountry() {
    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: KEYS.list(),
        queryFn: fetchCountries,
    });

    return {
        rows: data ?? [],
        isLoading,
        isError,
        error,
        refetch,
    };
}

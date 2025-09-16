'use client';

import { useQuery } from '@tanstack/react-query';
import { countriesQuery } from '@/features/country/queries/countryQueries';

/** Hook: 分頁後的 Country 列表 */
export default function useCountry(page = 1, pageSize = 10) {
    const { data, isLoading, isError, error, refetch } = useQuery(
        countriesQuery(page, pageSize)
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

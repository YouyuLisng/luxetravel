'use client';

import { useCountries } from '@/features/country/queries/countryQueries';

/** Hook: 直接取分頁後的 Country 列表 */
export default function useCountry(page = 1, pageSize = 10) {
    const { data, isLoading, isError, error, refetch } = useCountries(
        page,
        pageSize
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

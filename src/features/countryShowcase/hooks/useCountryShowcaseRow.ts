'use client';

import { useQuery } from '@tanstack/react-query';
import { countryShowcasesQuery } from '@/features/countryShowcase/queries/countryShowcaseQueries';

/** 取得 CountryShowcase 列表（分頁版） */
export default function useCountryShowcaseRow(page: number, pageSize: number) {
    const { data, isLoading, isError, error, refetch } = useQuery(
        countryShowcasesQuery(page, pageSize)
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

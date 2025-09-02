'use client';

import { useMemo } from 'react';
import useCountry from './useCountry';

/** Hook: 將 Country 列表整理成 table row */
export default function useCountryRow() {
    const { rows, isLoading, isError, refetch } = useCountry();

    const tableRows = useMemo(() => {
        return rows.map((country: any) => ({
            id: country.id,
            code: country.code,
            nameZh: country.nameZh,
            nameEn: country.nameEn,
            imageUrl: country.imageUrl,
            enabled: country.enabled,
            createdAt: country.createdAt,
            updatedAt: country.updatedAt,
        }));
    }, [rows]);

    return {
        rows: tableRows,
        isLoading,
        isError,
        refetch,
    };
}

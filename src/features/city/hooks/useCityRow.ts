'use client';

import { useMemo } from 'react';
import { useCities } from '../queries/cityQueries';

/** Hook: 將 City 列表整理成 table row */
export default function useCityRow() {
    const { data, isLoading, isError, refetch } = useCities();

    const rows = useMemo(() => {
        if (!data) return [];
        return data.map((city: any) => ({
            id: city.id,
            code: city.code,
            nameZh: city.nameZh,
            nameEn: city.nameEn,
            country: city.country,
            imageUrl: city.imageUrl,
            enabled: city.enabled,
            createdAt: city.createdAt,
        }));
    }, [data]);

    return {
        rows,
        isLoading,
        isError,
        refetch,
    };
}

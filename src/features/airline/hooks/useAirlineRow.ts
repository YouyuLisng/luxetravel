'use client';

import { useMemo } from 'react';
import { useAirlines } from '../queries/airlineQueries';

/** Hook: 將 Airline 列表整理成 table row */
export default function useAirlineRow() {
    const { data, isLoading, isError, refetch } = useAirlines();

    const rows = useMemo(() => {
        if (!data) return [];
        return data.map((airline: any) => ({
            id: airline.id,
            code: airline.code,
            nameZh: airline.nameZh,
            nameEn: airline.nameEn,
            imageUrl: airline.imageUrl,
            enabled: airline.enabled,
            createdAt: airline.createdAt,
        }));
    }, [data]);

    return {
        rows,
        isLoading,
        isError,
        refetch,
    };
}

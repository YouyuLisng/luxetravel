'use client';

import { useMemo } from 'react';
import useAirport from './useAirport';

/** Hook: 將 Airport 列表整理成 table row */
export default function useAirportRow() {
    const { rows, pagination, isLoading, isError, refetch } = useAirport();

    const tableRows = useMemo(() => {
        return rows.map((airport: any) => ({
            id: airport.id,
            code: airport.code,
            nameZh: airport.nameZh,
            nameEn: airport.nameEn,
            region: airport.region?.nameZh ?? '',
            country: airport.country?.nameZh ?? '',
            imageUrl: airport.imageUrl,
            enabled: airport.enabled,
            createdAt: airport.createdAt,
        }));
    }, [rows]);

    return {
        rows: tableRows,
        pagination,
        isLoading,
        isError,
        refetch,
    };
}

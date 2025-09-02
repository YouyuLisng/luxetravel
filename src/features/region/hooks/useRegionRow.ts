'use client';

import { useMemo } from 'react';
import useRegion from './useRegion';

/** Hook: 將 Region 列表整理成 table row */
export default function useRegionRow() {
    const { rows, isLoading, isError, refetch, } = useRegion();

    const tableRows = useMemo(() => {
        return rows.map((r: any) => ({
            id: r.id,
            code: r.code,
            nameZh: r.nameZh,
            nameEn: r.nameEn,
            imageUrl: r.imageUrl,
            enabled: r.enabled,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
        }));
    }, [rows]);

    return {
        rows: tableRows,
        isLoading,
        isError,
        refetch,
    };
}

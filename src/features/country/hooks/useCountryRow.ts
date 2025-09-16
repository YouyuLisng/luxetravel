'use client';

import { useMemo } from 'react';
import useCountry from './useCountry';

/** Hook: 將 Country 列表整理成 table row */
export default function useCountryRow(page = 1, pageSize = 10) {
  const { rows, pagination, isLoading, isError, refetch } = useCountry(page, pageSize);

  const tableRows = useMemo(() => {
    return rows.map((c: any) => ({
      id: c.id,
      code: c.code,
      nameZh: c.nameZh,
      nameEn: c.nameEn,
      imageUrl: c.imageUrl,
      enabled: c.enabled,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
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

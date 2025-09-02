'use client';

import { useQuery } from '@tanstack/react-query';
import { cityQuery } from '@/features/city/queries/cityQueries';

/** 取得單筆 City */
export default function useCity(id: string, enabled = true) {
    const q = cityQuery(id);
    return useQuery({ ...q, enabled: enabled && !!id });
}

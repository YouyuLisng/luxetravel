'use client';

import { useQuery } from '@tanstack/react-query';
import { regionQuery } from '@/features/region/queries/regionQueries';

/** 取得單筆 Region */
export default function useRegion(id: string, enabled = true) {
    const q = regionQuery(id);
    return useQuery({ ...q, enabled: enabled && !!id });
}

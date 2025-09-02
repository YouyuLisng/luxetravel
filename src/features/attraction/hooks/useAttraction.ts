'use client';

import { useQuery } from '@tanstack/react-query';
import { attractionQuery } from '@/features/attraction/queries/attractionQueries';

/** 取得單筆 Attraction */
export default function useAttraction(id: string, enabled = true) {
    const q = attractionQuery(id);
    return useQuery({ ...q, enabled: enabled && !!id });
}

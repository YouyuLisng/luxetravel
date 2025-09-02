'use client';

import { useQuery } from '@tanstack/react-query';
import { KEYS, travelAdvantageQuery } from '@/features/travelAdvantage/queries/travelAdvantageQuery';

/** 取得單筆 Advantage */
export default function useTravelAdvantage(id: string, enabled = true) {
    const q = travelAdvantageQuery(id);
    return useQuery({ ...q, enabled: enabled && !!id });
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { airlineQuery } from '@/features/airline/queries/airlineQueries';

/** 取得單筆 Airline */
export default function useAirline(id: string, enabled = true) {
    const q = airlineQuery(id);
    return useQuery({ ...q, enabled: enabled && !!id });
}

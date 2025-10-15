'use client';

import { useQuery } from '@tanstack/react-query';
import { airportQuery } from '@/features/airport/queries/airportQueries';

/** 取得單筆 Airport */
export default function useAirport(id: string, enabled = true) {
    const q = airportQuery(id);
    return useQuery({ ...q, enabled: enabled && !!id });
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { travelConcernQuery } from '@/features/travelConcern/queries/travelConcernQuery';

/** 取得單筆 TravelConcern */
export default function useTravelConcern(id: string, enabled = true) {
  const q = travelConcernQuery(id);
  return useQuery({ ...q, enabled: enabled && !!id });
}

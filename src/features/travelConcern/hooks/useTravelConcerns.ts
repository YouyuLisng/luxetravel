// features/travelConcern/hooks/useTravelConcern.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import {
  travelConcernsQuery,
  travelConcernQuery,
} from '@/features/travelConcern/queries/travelConcernQuery';

/** 取得 TravelConcern 列表 */
export function useTravelConcernsQuery() {
  return useQuery(travelConcernsQuery());
}

/** 取得單筆 TravelConcern */
export function useTravelConcernQuery(id: string, enabled = true) {
  return useQuery({ ...travelConcernQuery(id), enabled });
}

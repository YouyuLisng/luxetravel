'use client';

import { useQuery } from '@tanstack/react-query';
import { tourProductQuery } from '@/features/product/queries/tourProductQueries';

/** 取得單筆 TourProduct */
export default function useTourProduct(id: string, enabled = true) {
    const q = tourProductQuery(id);
    return useQuery({ ...q, enabled: enabled && !!id });
}

'use client';

import { useQuery } from '@tanstack/react-query';
import {
    attractionsQuery,
    attractionQuery,
} from '@/features/attraction/queries/attractionQueries';

/** 取得景點列表（帶分頁） */
export function useAttractions(page: number = 1, pageSize: number = 20) {
    const q = attractionsQuery(page, pageSize);
    return useQuery(q);
}

/** 取得單筆 Attraction */
export function useAttraction(id: string, enabled = true) {
    const q = attractionQuery(id);
    return useQuery({ ...q, enabled: enabled && !!id });
}

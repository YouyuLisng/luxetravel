'use client';

import { useQuery } from '@tanstack/react-query';
import { bannerQuery } from '@/features/banner/queries/bannerQueries';

/** 取得單筆 Banner */
export default function useBanner(id: string, enabled = true) {
    const q = bannerQuery(id);
    return useQuery({ ...q, enabled: enabled && !!id });
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { travelArticleQuery } from '@/features/travelArticle/queries/travelArticleQueries';

/** 取得單筆 TravelArticle */
export default function useTravelArticle(id: string, enabled = true) {
    const q = travelArticleQuery(id);
    return useQuery({ ...q, enabled: enabled && !!id });
}

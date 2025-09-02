'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    attractionsQuery,
    KEYS,
} from '@/features/attraction/queries/attractionQueries';

/** Hook: 整理 Attraction 列表成 table rows */
export function useAttractionRows() {
    const { data, isLoading, isError, refetch } = useQuery(attractionsQuery());

    const rows = useMemo(() => {
        if (!data) return [];
        return data.map((a: any) => ({
            id: a.id,
            code: a.code,
            nameZh: a.nameZh,
            nameEn: a.nameEn,
            content: a.content,
            region: a.region,
            country: a.country,
            city: a.city,
            tags: a.tags,
            imageUrl: a.imageUrl,
            enabled: a.enabled,
            createdAt: a.createdAt,
        }));
    }, [data]);

    return {
        rows,
        isLoading,
        isError,
        refetch,
    };
}

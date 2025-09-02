// features/travelArticle/hooks/useTravelArticleRow.ts
'use client';

import * as React from 'react';
import { useTravelArticlesQuery } from './useTravelArticle';

export type TravelArticleRow = { id: string | number } & Record<string, any>;

export function useTravelArticleRows() {
    const query = useTravelArticlesQuery();

    const rows = React.useMemo<TravelArticleRow[]>(
        () =>
            (query.data ?? []).map((a: any, i: number) => ({
                id: a.id ?? a._id ?? a.travelArticleId ?? i + 1,
                ...a,
            })),
        [query.data]
    );

    return { ...query, rows };
}

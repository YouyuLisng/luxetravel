// features/category/hooks/useCategoryRow.ts
'use client';

import * as React from 'react';
import { useCategorysQuery } from './useCategory';

export type CategoryRow = { id: string | number } & Record<string, any>;

export function useCategoryRows() {
    const query = useCategorysQuery();

    const rows = React.useMemo<CategoryRow[]>(
        () =>
            (query.data ?? []).map((r: any, i: number) => ({
                id: r.id ?? r._id ?? r.categoryId ?? i + 1,
                ...r,
            })),
        [query.data]
    );

    return { ...query, rows };
}


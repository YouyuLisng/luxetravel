// features/travelConcern/hooks/useTravelConcernsRow.ts
'use client';

import * as React from 'react';
import { useTravelConcernsQuery } from './useTravelConcerns';

export type TravelConcernRow = { id: string | number } & Record<string, any>;

export function useTravelConcernsRows() {
    const query = useTravelConcernsQuery();

    const rows = React.useMemo<TravelConcernRow[]>(
        () =>
            (query.data ?? []).map((t: any, i: number) => ({
                id: t.id ?? t._id ?? t.travelConcernId ?? i + 1,
                ...t,
            })),
        [query.data]
    );

    return { ...query, rows };
}

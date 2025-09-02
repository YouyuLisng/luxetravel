'use client';

import * as React from 'react';
import { useTravelAdvantagesQuery } from './useTravelAdvantage';

export type TravelAdvantageRow = { id: string | number } & Record<string, any>;

export function useTravelAdvantageRows() {
    const query = useTravelAdvantagesQuery();

    const rows = React.useMemo<TravelAdvantageRow[]>(
        () =>
            (query.data ?? []).map((a: any, i: number) => ({
                id: a.id ?? a._id ?? a.travelAdvantageId ?? i + 1,
                ...a,
            })),
        [query.data]
    );

    return { ...query, rows };
}

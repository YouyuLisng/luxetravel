'use client';

import * as React from 'react';
import { useCountryShowcasesQuery } from './useCountryShowcase';

export type CountryShowcaseRow = { id: string | number } & Record<string, any>;

export function useCountryShowcaseRows() {
    const query = useCountryShowcasesQuery();

    const rows = React.useMemo<CountryShowcaseRow[]>(
        () =>
            (query.data ?? []).map((c: any, i: number) => ({
                id: c.id ?? c._id ?? c.countryShowcaseId ?? i + 1,
                ...c,
            })),
        [query.data]
    );

    return { ...query, rows };
}

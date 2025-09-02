'use client';

import * as React from 'react';
import { useBannersQuery } from './useBanner';

export type BannerRow = { id: string | number } & Record<string, any>;

export function useBannerRows() {
    const query = useBannersQuery();

    const rows = React.useMemo<BannerRow[]>(
        () =>
            (query.data ?? []).map((b: any, i: number) => ({
                id: b.id ?? b._id ?? b.bannerId ?? i + 1,
                ...b,
            })),
        [query.data]
    );

    return { ...query, rows };
}

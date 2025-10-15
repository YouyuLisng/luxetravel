// features/users/hooks/useUserRow.ts
'use client';

import * as React from 'react';
import { useUsers } from './useUsers';

export type UserRow = { id: string | number } & Record<string, any>;

export function useUserRows() {
    const query = useUsers();

    const { list, pagination } = React.useMemo(() => {
        const d: any = query.data;
        if (Array.isArray(d)) return { list: d, pagination: undefined };
        if (d && Array.isArray(d.data))
            return { list: d.data, pagination: d.pagination };
        return { list: [], pagination: undefined };
    }, [query.data]);

    const rows = React.useMemo<UserRow[]>(
        () =>
            list.map((u: any, i: number) => ({
                id: u.id ?? u._id ?? u.userId ?? i + 1,
                ...u,
            })),
        [list]
    );

    return { ...query, rows, pagination };
}

export default useUserRows;

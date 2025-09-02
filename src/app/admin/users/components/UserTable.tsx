// app/(admin)/admin/users/page.tsx
'use client';

import { useUsers } from '@/features/users/hooks/useUsers';
import { UserDataTable } from '@/app/admin/users/components/data-table';
import GlobalLoading from '@/components/GlobalLoading';

export default function UserTable() {
    const { data: users, isLoading } = useUsers();

    if (isLoading) return <GlobalLoading />;

    return (
        <UserDataTable data={users ?? []} />
    );
}

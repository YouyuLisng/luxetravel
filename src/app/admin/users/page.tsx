'use client';

import * as React from 'react';
import GlobalLoading from '@/components/GlobalLoading';
import { DataTable } from '@/components/DataTable';

import { deleteUser } from '@/app/admin/users/action/user';
import useUserRows from '@/features/users/hooks/useUserRow';

export default function Page() {
    // TanStack Query v5 建議用 status / fetchStatus 來判斷載入狀態
    const { rows, status, fetchStatus, isFetching, isError, refetch } =
        useUserRows();

    // 初次載入（無資料）或正在抓第一批資料 → 顯示全頁 Loading
    const showInitialLoading =
        status === 'pending' ||
        (fetchStatus === 'fetching' && (!rows || rows.length === 0));

    if (showInitialLoading) return <GlobalLoading />;
    if (isError) return <p className="p-6">載入失敗</p>;

    return (
        <DataTable
            data={rows}
            visibleKeys={['name', 'role', 'emailVerified', 'createdAt']}
            columnLabels={{
                name: '使用者',
                role: '角色',
                emailVerified: '信箱驗證',
                createdAt: '建立時間',
                actions: '操作',
            }}
            onDelete={async (id) => {
                const res = await deleteUser(id);
                if (res?.error) throw new Error(res.error);
                return res;
            }}
            onRefresh={refetch}
            getEditHref={(id) => `/admin/users/${id}`}
            addButtonLabel="新增使用者"
            addButtonHref="/admin/users/new"
        />
    );
}

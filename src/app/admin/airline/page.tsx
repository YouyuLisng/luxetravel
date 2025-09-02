'use client';

import * as React from 'react';
import GlobalLoading from '@/components/GlobalLoading';
import { DataTable } from '@/components/DataTable';

import { deleteAirline } from '@/app/admin/airline/action/airline';
import useAirlineRows from '@/features/airline/hooks/useAirlineRow';

export default function Page() {
    const { rows, isLoading, isError, refetch } = useAirlineRows();

    if (isLoading) return <GlobalLoading />;
    if (isError) return <p className="p-6">載入失敗</p>;

    return (
        <>
            <DataTable
                data={rows}
                visibleKeys={[
                    'imageUrl',
                    'code',
                    'nameZh',
                    'nameEn',
                    'enabled',
                ]}
                columnLabels={{
                    imageUrl: '圖片',
                    code: '代碼',
                    nameZh: '中文名',
                    nameEn: '英文名',
                    enabled: '啟用',
                    actions: '操作',
                }}
                onDelete={async (id) => {
                    const res = await deleteAirline(id);
                    if (res?.error) throw new Error(res.error);
                    return res;
                }}
                onRefresh={refetch}
                getEditHref={(id) => `/admin/airline/${id}`}
                addButtonLabel="新增航空公司"
                addButtonHref="/admin/airline/new"
            />
        </>
    );
}

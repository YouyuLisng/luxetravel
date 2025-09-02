'use client';

import * as React from 'react';
import GlobalLoading from '@/components/GlobalLoading';
import { DataTable } from '@/components/DataTable';

import { deleteAttraction } from '@/app/admin/attraction/action/attraction';
import { useAttractionRows } from '@/features/attraction/hooks/useAttractionRow';

export default function Page() {
    const { rows, isLoading, isError, refetch } = useAttractionRows();

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
                    'region',
                    'country',
                    'city',
                    'enabled',
                ]}
                columnLabels={{
                    imageUrl: '圖片',
                    code: '代碼',
                    nameZh: '中文名',
                    nameEn: '英文名',
                    region: '地區',
                    country: '國家',
                    city: '城市',
                    enabled: '啟用',
                    actions: '操作',
                }}
                onDelete={async (id) => {
                    const res = await deleteAttraction(id);
                    if (res?.error) throw new Error(res.error);
                    return res;
                }}
                onRefresh={refetch}
                getEditHref={(id) => `/admin/attraction/${id}`}
                addButtonLabel="新增景點"
                addButtonHref="/admin/attraction/new"
            />
        </>
    );
}

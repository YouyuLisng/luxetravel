'use client';

import * as React from 'react';
import GlobalLoading from '@/components/GlobalLoading';
import { DataTable } from '@/components/DataTable';

import { deleteCity } from '@/app/admin/city/action/city';
import useCityRows from '@/features/city/hooks/useCityRow';

export default function Page() {
    const { rows, isLoading, isError, refetch } = useCityRows();

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
                    'country',
                    'enabled',
                ]}
                columnLabels={{
                    imageUrl: '圖片',
                    code: '代碼',
                    nameZh: '中文名',
                    nameEn: '英文名',
                    country: '國家',
                    enabled: '啟用',
                    actions: '操作',
                }}
                onDelete={async (id) => {
                    const res = await deleteCity(id);
                    if (res?.error) throw new Error(res.error);
                    return res;
                }}
                onRefresh={refetch}
                getEditHref={(id) => `/admin/city/${id}`}
                addButtonLabel="新增城市"
                addButtonHref="/admin/city/new"
            />
        </>
    );
}

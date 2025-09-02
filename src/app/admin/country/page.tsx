'use client';

import * as React from 'react';
import GlobalLoading from '@/components/GlobalLoading';
import { DataTable } from '@/components/DataTable';

import { deleteCountry } from '@/app/admin/country/action/country';
import useCountryRows from '@/features/country/hooks/useCountryRow';

export default function Page() {
    const { rows, isLoading, isError, refetch } = useCountryRows();

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
                    'linkUrl',
                ]}
                columnLabels={{
                    imageUrl: '圖片',
                    code: '地區代碼',
                    nameZh: '中文名稱',
                    nameEn: '英文名稱',
                    linkUrl: '連結',
                    enabled: '是否啟用',
                    actions: '操作',
                }}
                onDelete={async (id) => {
                    const res = await deleteCountry(id);
                    if (res?.error) throw new Error(res.error);
                    return res;
                }}
                onRefresh={refetch}
                getEditHref={(id) => `/admin/country/${id}`}
                addButtonLabel="新增國家"
                addButtonHref="/admin/country/new"
            />
        </>
    );
}

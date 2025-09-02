'use client';

import * as React from 'react';
import GlobalLoading from '@/components/GlobalLoading';
import { DataTable } from '@/components/DataTable';

import { deleteAirport } from '@/app/admin/airport/action/airport';
import useAirportRow from '@/features/airport/hooks/useAirportRow';

export default function Page() {
    const { rows, isLoading, isError, refetch } = useAirportRow();

    if (isLoading) return <GlobalLoading />;
    if (isError) return <p className="p-6">載入失敗</p>;
    console.log(rows);
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
                    'enabled',
                ]}
                columnLabels={{
                    imageUrl: '圖片',
                    code: '代碼',
                    nameZh: '中文名',
                    nameEn: '英文名',
                    region: '地區',
                    country: '國家',
                    enabled: '啟用',
                    actions: '操作',
                }}
                onDelete={async (id) => {
                    const res = await deleteAirport(id);
                    if (res?.error) throw new Error(res.error);
                    return res;
                }}
                onRefresh={refetch}
                getEditHref={(id) => `/admin/airport/${id}`}
                addButtonLabel="新增機場"
                addButtonHref="/admin/airport/new"
            />
        </>
    );
}

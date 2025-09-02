'use client';

import * as React from 'react';
import GlobalLoading from '@/components/GlobalLoading';
import { DataTable } from '@/components/DataTable';

import {
    deleteRegion,
} from '@/app/admin/region/action/region';
import useRegionRows from '@/features/region/hooks/useRegionRow';

export default function Page() {
    const { rows, isLoading, isError, refetch } = useRegionRows();

    if (isLoading) return <GlobalLoading />;
    if (isError) return <p className="p-6">載入失敗</p>;

    return (
        <>
            <DataTable
                data={rows}
                visibleKeys={[ 'imageUrl', 'code', 'nameZh', 'nameEn', 'enabled', 'linkUrl']}
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
                    const res = await deleteRegion(id);
                    if (res?.error) throw new Error(res.error);
                    return res;
                }}
                onRefresh={refetch}
                getEditHref={(id) => `/admin/region/${id}`}
                addButtonLabel="新增地區"
                addButtonHref="/admin/region/new"
            />
        </>
    );
}

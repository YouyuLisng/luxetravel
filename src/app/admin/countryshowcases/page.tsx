'use client';

import * as React from 'react';
import GlobalLoading from '@/components/GlobalLoading';
import { DataTable } from '@/components/DataTable';

import {
    deleteCountryShowcase,
    reorderCountryShowcasesByIds,
} from '@/app/admin/countryshowcases/action/countryShowcase';
import { useCountryShowcaseRows } from '@/features/countryShowcase/hooks/useCountryShowcaseRow';

export default function Page() {
    const { rows, isLoading, isError, refetch } = useCountryShowcaseRows();

    if (isLoading) return <GlobalLoading />;
    if (isError) return <p className="p-6">載入失敗</p>;

    return (
        <>
            <DataTable
                data={rows}
                visibleKeys={[
                    'imageUrl',
                    'title',
                    'subtitle',
                    'linkUrl',
                    'isActive',
                    'order',
                ]}
                columnLabels={{
                    imageUrl: '圖片',
                    title: '標題',
                    subtitle: '副標',
                    linkUrl: '連結',
                    isActive: '啟用',
                    order: '排序',
                    createdAt: '建立時間',
                    actions: '操作',
                }}
                onDelete={async (id) => {
                    const res = await deleteCountryShowcase(id);
                    if (res?.error) throw new Error(res.error);
                    return res;
                }}
                onReorder={async (ids) => {
                    const res = await reorderCountryShowcasesByIds(ids);
                    if (res?.error) throw new Error(res.error);
                    return res;
                }}
                onRefresh={refetch}
                getEditHref={(id) => `/admin/countryshowcases/${id}`}
                addButtonLabel="新增經典行程卡片" 
                addButtonHref="/admin/countryshowcases/new"
            />
        </>
    );
}

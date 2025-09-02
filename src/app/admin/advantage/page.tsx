'use client';

import * as React from 'react';
import GlobalLoading from '@/components/GlobalLoading';
import { DataTable } from '@/components/DataTable';
import { useTravelAdvantageRows } from '@/features/travelAdvantage/hooks/useTravelAdvantageRow';
import {
    deleteTravelAdvantage,
    reorderTravelAdvantagesByIds,
} from '@/app/admin/advantage/action/travelAdvantage';

export default function Page() {
    const { rows, isLoading, isError, refetch } = useTravelAdvantageRows();

    if (isLoading) return <GlobalLoading />;
    if (isError) return <p className="p-6">載入失敗</p>;

    return (
        <>
            <DataTable
                data={rows}
                visibleKeys={[
                    'imageUrl',
                    'title',
                    'content',
                    'order',
                ]}
                columnLabels={{
                    imageUrl: '圖片',
                    title: '標題',
                    content: '副標',
                    order: '排序',
                    actions: '操作',
                }}
                onDelete={async (id) => {
                    const res = await deleteTravelAdvantage(id);
                    if (res?.error) throw new Error(res.error);
                    return res;
                }}
                onReorder={async (ids) => {
                    const res = await reorderTravelAdvantagesByIds(ids);
                    if (res?.error) throw new Error(res.error);
                    return res;
                }}
                onRefresh={refetch}
                getEditHref={(id) => `/admin/advantage/${id}`}
                addButtonLabel="典藏優勢"
                addButtonHref="/admin/advantage/new"
            />
        </>
    );
}

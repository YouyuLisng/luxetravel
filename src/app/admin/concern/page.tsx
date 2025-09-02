'use client';

import * as React from 'react';
import GlobalLoading from '@/components/GlobalLoading';
import { DataTable } from '@/components/DataTable';
import { useTravelConcernsRows } from '@/features/travelConcern/hooks/useTravelConcernsRow';
import {
    deleteTravelConcern,
    reorderTravelConcernsByIds,
} from '@/app/admin/concern/action/travelConcern';

export default function Page() {
    const { rows, isLoading, isError, refetch } = useTravelConcernsRows();

    if (isLoading) return <GlobalLoading />;
    if (isError) return <p className="p-6">載入失敗</p>;

    return (
        <>
            <DataTable
                data={rows}
                visibleKeys={['order', 'content']}
                columnLabels={{
                    order: '排序',
                    content: '內容',
                    actions: '操作',
                }}
                onDelete={async (id) => {
                    const res = await deleteTravelConcern(id);
                    if (res?.error) throw new Error(res.error);
                    return res;
                }}
                onReorder={async (ids) => {
                    const res = await reorderTravelConcernsByIds(ids);
                    if (res?.error) throw new Error(res.error);
                    return res;
                }}
                onRefresh={refetch}
                getEditHref={(id) => `/admin/concern/${id}`}
                addButtonLabel="自由行規劃"
                addButtonHref="/admin/concern/new"
            />
        </>
    );
}

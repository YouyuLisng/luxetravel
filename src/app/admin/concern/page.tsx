'use client';

import * as React from 'react';
import GlobalLoading from '@/components/GlobalLoading';
import { DataTable } from '@/components/DataTable';
import {
    deleteTravelConcern,
    reorderTravelConcernsByIds,
} from '@/app/admin/concern/action/travelConcern';
import useTravelConcernRow from '@/features/travelConcern/hooks/useTravelConcernsRow';

export default function Page() {
    const [page, setPage] = React.useState(1);
    const [pageSize, setPageSize] = React.useState(10);

    const { rows, pagination, isLoading, isError, refetch } =
        useTravelConcernRow(page, pageSize);

    if (isLoading) return <GlobalLoading />;
    if (isError) return <p className="p-6">載入失敗</p>;

    return (
        <DataTable
            data={rows}
            pagination={pagination}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            visibleKeys={['number', 'content', 'order']}
            columnLabels={{
                number: '編號',
                content: '內容',
                order: '排序',
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
            addButtonLabel="新增自由行規劃"
            addButtonHref="/admin/concern/new"
        />
    );
}

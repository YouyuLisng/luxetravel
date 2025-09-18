'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import GlobalLoading from '@/components/GlobalLoading';
import { DataTable } from '@/components/DataTable';
import {
    deleteTravelConcern,
    reorderTravelConcernsByIds,
} from '@/app/admin/concern/action/travelConcern';
import useTravelConcernRow from '@/features/travelConcern/hooks/useTravelConcernsRow';

export default function Page() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [page, setPage] = React.useState(
        Number(searchParams.get('page')) || 1
    );
    const [pageSize, setPageSize] = React.useState(
        Number(searchParams.get('pageSize')) || 50
    );

    const { rows, pagination, isLoading, isError, refetch } =
        useTravelConcernRow(page, pageSize);

    React.useEffect(() => {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('pageSize', String(pageSize));
        router.replace(`?${params.toString()}`);
    }, [page, pageSize, router]);

    const currentQuery = searchParams.toString()
        ? `?${searchParams.toString()}`
        : '';

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
            getEditHref={(id) => `/admin/concern/${id}${currentQuery}`}
            addButtonLabel="新增自由行規劃"
            addButtonHref={`/admin/concern/new${currentQuery}`}
        />
    );
}

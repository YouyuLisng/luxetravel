'use client';

import * as React from 'react';
import GlobalLoading from '@/components/GlobalLoading';
import { DataTable } from '@/components/DataTable';
import {
    deleteCountryShowcase,
    reorderCountryShowcasesByIds,
} from '@/app/admin/countryshowcases/action/countryShowcase';
import useCountryShowcaseRow from '@/features/countryShowcase/hooks/useCountryShowcaseRow';

export default function Page() {
    const [page, setPage] = React.useState(1);
    const [pageSize, setPageSize] = React.useState(10);

    const { rows, pagination, isLoading, isError, refetch } =
        useCountryShowcaseRow(page, pageSize);

    if (isLoading) return <GlobalLoading />;
    if (isError) return <p className="p-6">載入失敗</p>;

    return (
        <DataTable
            data={rows}
            pagination={pagination}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            visibleKeys={[
                'imageUrl',
                'title',
                'subtitle',
                'description',
                'linkUrl',
                'linkText',
                'order',
            ]}
            columnLabels={{
                imageUrl: '圖片',
                title: '標題',
                subtitle: '副標題',
                description: '描述',
                linkUrl: '連結',
                linkText: '連結文字',
                order: '排序',
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
    );
}

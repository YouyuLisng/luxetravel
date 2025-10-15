'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import GlobalLoading from '@/components/GlobalLoading';
import { DataTable } from '@/components/DataTable';
import {
    deleteCountryShowcase,
    reorderCountryShowcasesByIds,
} from '@/app/admin/countryshowcases/action/countryShowcase';
import useCountryShowcaseRow from '@/features/countryShowcase/hooks/useCountryShowcaseRow';

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
        useCountryShowcaseRow(page, pageSize);

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
            visibleKeys={[
                'bookImage',
                'title',
                'subtitle',
                'description',
                'linkUrl',
                'linkText',
                'order',
            ]}
            columnLabels={{
                bookImage: '圖片',
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
            getEditHref={(id) => `/admin/countryshowcases/${id}${currentQuery}`}
            addButtonLabel="新增經典行程卡片"
            addButtonHref={`/admin/countryshowcases/new${currentQuery}`}
        />
    );
}

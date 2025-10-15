'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import GlobalLoading from '@/components/GlobalLoading';
import { DataTable } from '@/components/DataTable';
import { deleteBanner } from '@/app/admin/banner/action/banner';
import useBannerRow from '@/features/banner/hooks/useBannerRows';

export default function Page() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [page, setPage] = React.useState(
        Number(searchParams.get('page')) || 1
    );
    const [pageSize, setPageSize] = React.useState(
        Number(searchParams.get('pageSize')) || 50
    );

    const { rows, pagination, isLoading, isError, refetch } = useBannerRow(
        page,
        pageSize
    );

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
                'imageUrl',
                'title',
                'subtitle',
                'linkText',
                'linkUrl',
                'order',
            ]}
            columnLabels={{
                imageUrl: '圖片',
                title: '標題',
                subtitle: '副標題',
                linkText: '連結文字',
                linkUrl: '連結網址',
                order: '排序',
                actions: '操作',
            }}
            onDelete={async (id) => {
                const res = await deleteBanner(id);
                if (res?.error) throw new Error(res.error);
                return res;
            }}
            onRefresh={refetch}
            getEditHref={(id) => `/admin/banner/${id}${currentQuery}`}
            addButtonLabel="新增首頁輪播大圖"
            addButtonHref={`/admin/banner/new${currentQuery}`}
        />
    );
}

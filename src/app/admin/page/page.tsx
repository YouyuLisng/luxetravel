'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import GlobalLoading from '@/components/GlobalLoading';
import { DataTable } from '@/components/DataTable';
import { deletePage } from '@/app/admin/page/action/index';
import usePageRow from '@/features/page/hooks/usePageRow';

export default function Page() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [page, setPage] = React.useState(
        Number(searchParams.get('page')) || 1
    );
    const [pageSize, setPageSize] = React.useState(
        Number(searchParams.get('pageSize')) || 50
    );
    const [keyword, setKeyword] = React.useState(searchParams.get('q') || '');

    const { rows, pagination, isLoading, isError, refetch } = usePageRow(
        page,
        pageSize,
        keyword
    );

    React.useEffect(() => {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('pageSize', String(pageSize));
        if (keyword) params.set('q', keyword);
        router.replace(`?${params.toString()}`);
    }, [page, pageSize, keyword, router]);

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
            searchValue={keyword}
            onSearch={(kw) => {
                setKeyword(kw);
                setPage(1);
            }}
            visibleKeys={[ 'seoImage','title', 'slug', 'seoTitle', 'seoDesc', 'keywords']}
            columnLabels={{
                imageUrl: '圖片',
                title: '標題',
                slug: '網址',
                seoTitle: '標題',
                seoDesc: '描述',
                keywords: '關鍵字',
                actions: '操作',
            }}
            onDelete={async (id) => {
                const res = await deletePage(id);
                if (res?.error) throw new Error(res.error);
                return res;
            }}
            onRefresh={refetch}
            getEditHref={(id) => `/admin/page/${id}${currentQuery}`}
            addButtonLabel="新增 Page"
            addButtonHref={`/admin/page/new${currentQuery}`}
        />
    );
}

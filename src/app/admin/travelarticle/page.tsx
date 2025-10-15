'use client';

import * as React from 'react';
import GlobalLoading from '@/components/GlobalLoading';
import { DataTable } from '@/components/DataTable';
import { deleteArticle } from '@/app/admin/travelarticle/action/travelArticle';
import useTravelArticleRow from '@/features/travelArticle/hooks/useTravelArticleRow';

export default function Page() {
    const [page, setPage] = React.useState(1);
    const [pageSize, setPageSize] = React.useState(10);

    const { rows, pagination, isLoading, isError, refetch } =
        useTravelArticleRow(page, pageSize);

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
                'linkUrl',
                'countries',
            ]}
            columnLabels={{
                imageUrl: '圖片',
                title: '標題',
                subtitle: '副標題',
                linkUrl: '連結',
                countries: '國家',
                actions: '操作',
            }}
            onDelete={async (id) => {
                const res = await deleteArticle(id);
                if (res?.error) throw new Error(res.error);
                return res;
            }}
            onRefresh={refetch}
            getEditHref={(id) => `/admin/travelarticle/${id}`}
            addButtonLabel="新增文章"
            addButtonHref="/admin/travelarticle/new"
        />
    );
}

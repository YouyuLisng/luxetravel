'use client';

import * as React from 'react';
import GlobalLoading from '@/components/GlobalLoading';
import { DataTable } from '@/components/DataTable';

import {
    deleteArticle,
} from '@/app/admin/travelarticle/action/travelArticle';
import { useTravelArticleRows } from '@/features/travelArticle/hooks/useTravelArticleRow';

export default function Page() {
    const { rows, isLoading, isError, refetch } = useTravelArticleRows();

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
                    'countries',
                    'linkUrl',
                ]}
                columnLabels={{
                    imageUrl: '圖片',
                    title: '標題',
                    subtitle: '副標',
                    countries: '國家',
                    linkUrl: '連結',
                    actions: '操作',
                }}
                onDelete={async (id) => {
                    const res = await deleteArticle(id);
                    if (res?.error) throw new Error(res.error);
                    return res;
                }}
                onRefresh={refetch}
                getEditHref={(id) => `/admin/travelarticle/${id}`}
                addButtonLabel="典藏推薦" 
                addButtonHref="/admin/travelarticle/new"
            />
        </>
    );
}

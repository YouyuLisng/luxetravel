'use client';

import * as React from 'react';
import GlobalLoading from '@/components/GlobalLoading';
import { DataTable } from '@/components/DataTable';
import { useFeedbackRows } from '@/features/feedback/hooks/useFeedbackRow';
import { deleteFeedback } from '@/app/admin/feedback/action/feedback';

export default function Page() {
    const { rows, isLoading, isError, refetch } = useFeedbackRows();

    if (isLoading) return <GlobalLoading />;
    if (isError) return <p className="p-6">載入失敗</p>;
    
    return (
        <DataTable
            data={rows}
            visibleKeys={[
                'imageUrl',
                'order',
                'title',
                'subtitle',
                'countries',
                'linkUrl',
            ]}
            columnLabels={{
                imageUrl: '圖片',
                order: '排序',
                title: '標題',
                subtitle: '副標',
                countries: '國家',
                linkUrl: '連結',
                actions: '操作',
            }}
            onDelete={async (id) => {
                const res = await deleteFeedback(id);
                if (res?.error) throw new Error(res.error);
                return res;
            }}
            onRefresh={refetch}
            getEditHref={(id) => `/admin/feedback/${id}`}
            addButtonLabel="新增旅客迴響"
            addButtonHref="/admin/feedback/new"
        />
    );
}

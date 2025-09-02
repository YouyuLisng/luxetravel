'use client';

import * as React from 'react';
import GlobalLoading from '@/components/GlobalLoading';
import { DataTable } from '@/components/DataTable';
import {
    deleteFeedback,
    reorderFeedback,
} from '@/app/admin/feedback/action/feedback';
import useFeedbackRow from '@/features/feedback/hooks/useFeedbackRow';

export default function Page() {
    const [page, setPage] = React.useState(1);
    const [pageSize, setPageSize] = React.useState(10);

    const { rows, pagination, isLoading, isError, refetch } = useFeedbackRow(
        page,
        pageSize
    );

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
                'content',
                'nickname',
                'linkUrl',
                'linekName',
                'order',
            ]}
            columnLabels={{
                imageUrl: '圖片',
                title: '標題',
                subtitle: '副標題',
                content: '內容',
                nickname: '暱稱',
                linkUrl: '連結',
                linekName: '連結名稱',
                order: '排序',
                actions: '操作',
            }}
            onDelete={async (id) => {
                const res = await deleteFeedback(id);
                if (res?.error) throw new Error(res.error);
                return res;
            }}
            onReorder={async (ids) => {
                const res = await reorderFeedback(ids);
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

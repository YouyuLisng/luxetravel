'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import GlobalLoading from '@/components/GlobalLoading';
import { DataTable } from '@/components/DataTable';
import {
    deleteFeedback,
} from '@/app/admin/feedback/action/feedback';
import useFeedbackRow from '@/features/feedback/hooks/useFeedbackRow';

export default function Page() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [page, setPage] = React.useState(
        Number(searchParams.get('page')) || 1
    );
    const [pageSize, setPageSize] = React.useState(
        Number(searchParams.get('pageSize')) || 50
    );

    const { rows, pagination, isLoading, isError, refetch } = useFeedbackRow(
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
                'nickname',
                'title',
                'content',
                'linkUrl',
            ]}
            columnLabels={{
                imageUrl: '圖片',
                nickname: '暱稱',
                title: '標題',
                content: '內容',
                linkUrl: '連結',
                actions: '操作',
            }}
            onDelete={async (id) => {
                const res = await deleteFeedback(id);
                if (res?.error) throw new Error(res.error);
                return res;
            }}
            onRefresh={refetch}
            getEditHref={(id) => `/admin/feedback/${id}${currentQuery}`}
            addButtonLabel="新增旅客迴響"
            addButtonHref={`/admin/feedback/new${currentQuery}`}
        />
    );
}

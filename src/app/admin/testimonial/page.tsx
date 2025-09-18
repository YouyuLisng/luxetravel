'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import GlobalLoading from '@/components/GlobalLoading';
import { DataTable } from '@/components/DataTable';
import {
    deleteTestimonial,
    reorderTestimonialsByIds,
} from '@/app/admin/testimonial/action/testimonial';
import { useTestimonialRows } from '@/features/testimonial/hooks/useTestimonialRow';

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
        useTestimonialRows(page, pageSize);

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
                'stars',
                'content',
                'linkUrl',
                'mode',
                'order',
            ]}
            columnLabels={{
                imageUrl: '圖片',
                nickname: '暱稱',
                stars: '評價',
                content: '內容',
                linkUrl: '連結',
                mode: '類型',
                order: '排序',
                actions: '操作',
            }}
            onDelete={async (id) => {
                const res = await deleteTestimonial(id);
                if (res?.error) throw new Error(res.error);
                return res;
            }}
            onReorder={async (ids) => {
                const res = await reorderTestimonialsByIds(ids);
                if (res?.error) throw new Error(res.error);
                return res;
            }}
            onRefresh={refetch}
            getEditHref={(id) => `/admin/testimonial/${id}${currentQuery}`}
            addButtonLabel="新增真實旅客回饋"
            addButtonHref={`/admin/testimonial/new${currentQuery}`}
        />
    );
}

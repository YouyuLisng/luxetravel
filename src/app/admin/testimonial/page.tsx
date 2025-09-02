'use client';

import * as React from 'react';
import GlobalLoading from '@/components/GlobalLoading';
import { DataTable } from '@/components/DataTable';

import {
    deleteTestimonial,
    reorderTestimonialsByIds,
} from '@/app/admin/testimonial/action/testimonial';
import { useTestimonialRows } from '@/features/testimonial/hooks/useTestimonialRow';

export default function Page() {
    const { rows, isLoading, isError, refetch } = useTestimonialRows();

    if (isLoading) return <GlobalLoading />;
    if (isError) return <p className="p-6">載入失敗</p>;

    return (
        <>
            <DataTable
                data={rows}
                visibleKeys={['nickname', 'stars', 'content', 'linkUrl']}
                columnLabels={{
                    nickname: '暱稱',
                    stars:    '評價',
                    content:  '內容',
                    linkUrl:  '連結',
                    actions:  '操作',
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
                getEditHref={(id) => `/admin/testimonial/${id}`}
                addButtonLabel="新增真實旅客回饋"
                addButtonHref="/admin/testimonial/new"
            />
        </>
    );
}

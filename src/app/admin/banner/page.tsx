'use client';

import * as React from 'react';
import GlobalLoading from '@/components/GlobalLoading';
import { DataTable } from '@/components/DataTable';
import { useBannerRows } from '@/features/banner/hooks/useBannerRows';

import {
    deleteBanner,
    reorderBannersByIds,
} from '@/app/admin/banner/action/banner';

export default function BannerTable() {
    const { rows, isLoading, isError, refetch } = useBannerRows();

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
                    'linkUrl',
                    'order',
                ]}
                columnLabels={{
                    imageUrl: '圖片',
                    order: '排序',
                    title: '標題',
                    subtitle: '副標',
                    linkUrl: '連結',
                    actions: '操作',
                }}
                onDelete={async (id) => {
                    const res = await deleteBanner(id);
                    if (res?.error) throw new Error(res.error);
                    return res;
                }}
                onReorder={async (ids) => {
                    const res = await reorderBannersByIds(ids);
                    if (res?.error) throw new Error(res.error);
                    return res;
                }}
                onRefresh={refetch}
                getEditHref={(id) => `/admin/banner/${id}`}
                addButtonLabel="新增輪播"
                addButtonHref="/admin/banner/new"
            />
        </>
    );
}

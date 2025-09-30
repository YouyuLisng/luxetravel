'use client';

import * as React from 'react';
import GlobalLoading from '@/components/GlobalLoading';
import { DataTable } from '@/components/DataTable';
import useTourProductRows from '@/features/product/hooks/useTourProductRows';

import {
    deleteTourProduct,
    toggleFeatured,
} from '@/app/admin/product/action/product';

export default function TourProductTable() {
    const [page, setPage] = React.useState(1);
    const [pageSize, setPageSize] = React.useState(10);

    const { rows, pagination, isLoading, isError, refetch } =
        useTourProductRows(page, pageSize);

    if (isLoading) return <GlobalLoading />;
    if (isError) return <p className="p-6">載入失敗</p>;

    return (
        <DataTable
            data={rows}
            visibleKeys={[
                'code',
                'name',
                'days',
                'nights',
                'category',
                'priceMin',
                'priceMax',
                'status',
                'isFeatured', // ✅ 顯示精選欄位
            ]}
            columnLabels={{
                code: '行程編號',
                name: '名稱',
                days: '天數',
                nights: '晚數',
                category: '類別',
                priceMin: '最低價',
                priceMax: '最高價',
                status: '狀態',
                isFeatured: '精選', // ✅ 欄位標籤
                actions: '操作',
            }}
            onDelete={async (id: string) => {
                const res = await deleteTourProduct(id);
                if (res?.error) throw new Error(res.error);
                return res;
            }}
            onToggleFeatured={async (id: string, featured: boolean) => {
                const res = await toggleFeatured(id, featured);
                if (res?.error) throw new Error(res.error);
                return res;
            }}
            onRefresh={refetch}
            getEditHref={(id) => `/admin/product/${id}/wizard`}
            addButtonLabel="新增行程產品"
            addButtonHref="/admin/product/new"
            pagination={pagination}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
        />
    );
}

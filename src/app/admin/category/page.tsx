'use client';

import * as React from 'react';
import GlobalLoading from '@/components/GlobalLoading';
import { DataTable } from '@/components/DataTable';

import {
    deleteCategory,
} from '@/app/admin/category/action/category';
import { useCategoryRows } from '@/features/category/hooks/useCategoryRow';

export default function Page() {
    const { rows, isLoading, isError, refetch } = useCategoryRows();

    if (isLoading) return <GlobalLoading />;
    if (isError) return <p className="p-6">載入失敗</p>;

    return (
        <>
            <DataTable
                data={rows}
                visibleKeys={[ 'imageUrl', 'code', 'nameZh', 'nameEn', 'enabled', 'linkUrl']}
                columnLabels={{
                    imageUrl: '圖片',
                    code: '大類別代碼',
                    nameZh: '中文名稱',
                    nameEn: '英文名稱',
                    linkUrl: '連結',
                    enabled: '是否啟用',
                    actions: '操作',
                }}
                onDelete={async (id) => {
                    const res = await deleteCategory(id);
                    if (res?.error) throw new Error(res.error);
                    return res;
                }}
                onRefresh={refetch}
                getEditHref={(id) => `/admin/category/${id}`}
                addButtonLabel="新增大類別"
                addButtonHref="/admin/category/new"
            />
        </>
    );
}

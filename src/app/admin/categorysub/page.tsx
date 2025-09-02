'use client';

import * as React from 'react';
import GlobalLoading from '@/components/GlobalLoading';
import { DataTable } from '@/components/DataTable';

import { deleteSubCategory } from '@/app/admin/categorysub/action/subCategory';
import useSubCategoryRow from '@/features/categorysub/hooks/useSubCategoryRow';

export default function Page() {
    const { rows, isLoading, isError, refetch } = useSubCategoryRow();

    if (isLoading) return <GlobalLoading />;
    if (isError) return <p className="p-6">載入失敗</p>;

    return (
        <>
            <DataTable
                data={rows}
                visibleKeys={[
                    'imageUrl',
                    'code',
                    'nameZh',
                    'nameEn',
                    'categoryName',
                    'enabled',
                ]}
                columnLabels={{
                    imageUrl: '圖片',
                    code: '子類別代碼',
                    nameZh: '中文名稱',
                    nameEn: '英文名稱',
                    categoryName: '隸屬大類別',
                    enabled: '是否啟用',
                    actions: '操作',
                }}
                onDelete={async (id) => {
                    const res = await deleteSubCategory(id);
                    if (res?.error) throw new Error(res.error);
                    return res;
                }}
                onRefresh={refetch}
                getEditHref={(id) => `/admin/categorysub/${id}`}
                addButtonLabel="新增子類別"
                addButtonHref="/admin/categorysub/new"
            />
        </>
    );
}

'use client';

import * as React from 'react';
import GlobalLoading from '@/components/GlobalLoading';
import { DataTable } from '@/components/DataTable';
import { deleteRegion } from '@/app/admin/region/action/region';
import useRegionRow from '@/features/region/hooks/useRegionRow';

export default function Page() {
    const [page, setPage] = React.useState(1);
    const [pageSize, setPageSize] = React.useState(10);

    const { rows, pagination, isLoading, isError, refetch } = useRegionRow(
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
            visibleKeys={['imageUrl', 'code', 'nameZh', 'nameEn', 'enabled']}
            columnLabels={{
                imageUrl: '圖片',
                code: '代碼',
                nameZh: '中文名稱',
                nameEn: '英文名稱',
                enabled: '啟用',
                actions: '操作',
            }}
            onDelete={async (id) => {
                const res = await deleteRegion(id);
                if (res?.error) throw new Error(res.error);
                return res;
            }}
            onRefresh={refetch}
            getEditHref={(id) => `/admin/region/${id}`}
            addButtonLabel="新增地區"
            addButtonHref="/admin/region/new"
        />
    );
}

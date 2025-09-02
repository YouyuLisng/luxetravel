'use client';

import * as React from 'react';
import GlobalLoading from '@/components/GlobalLoading';
import { DataTable } from '@/components/DataTable';
import { deleteCountry } from '@/app/admin/country/action/country';
import useCountryRow from '@/features/country/hooks/useCountryRow';

export default function Page() {
    // 👉 分頁 state
    const [page, setPage] = React.useState(1);
    const [pageSize, setPageSize] = React.useState(10);

    // 👉 後端 hook
    const { rows, pagination, isLoading, isError, refetch } = useCountryRow(
        page,
        pageSize
    );

    if (isLoading) return <GlobalLoading />;
    if (isError) return <p className="p-6">載入失敗</p>;

    return (
        <DataTable
            data={rows}
            pagination={pagination} // 👈 後端 API 回傳的分頁資訊
            onPageChange={setPage} // 👈 換頁 callback
            onPageSizeChange={setPageSize} // 👈 修改每頁筆數 callback
            visibleKeys={['imageUrl', 'code', 'nameZh', 'nameEn', 'enabled']}
            columnLabels={{
                imageUrl: '圖片',
                code: '地區代碼',
                nameZh: '中文名稱',
                nameEn: '英文名稱',
                enabled: '是否啟用',
                actions: '操作',
            }}
            onDelete={async (id) => {
                const res = await deleteCountry(id);
                if (res?.error) throw new Error(res.error);
                return res;
            }}
            onRefresh={refetch}
            getEditHref={(id) => `/admin/country/${id}`}
            addButtonLabel="新增國家"
            addButtonHref="/admin/country/new"
        />
    );
}

'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import GlobalLoading from '@/components/GlobalLoading';
import { DataTable } from '@/components/DataTable';
import { deleteCountry } from '@/app/admin/country/action/country';
import useCountryRow from '@/features/country/hooks/useCountryRow';

export default function Page() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [page, setPage] = React.useState(
        Number(searchParams.get('page')) || 1
    );
    const [pageSize, setPageSize] = React.useState(
        Number(searchParams.get('pageSize')) || 50
    );

    const { rows, pagination, isLoading, isError, refetch } = useCountryRow(
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
            getEditHref={(id) => `/admin/country/${id}${currentQuery}`}
            addButtonLabel="新增國家"
            addButtonHref={`/admin/country/new${currentQuery}`}
        />
    );
}

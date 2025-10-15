'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import GlobalLoading from '@/components/GlobalLoading';
import { DataTable } from '@/components/DataTable';
import { deleteAttraction } from '@/app/admin/attraction/action/attraction';
import useAttractionRow from '@/features/attraction/hooks/useAttractionRow';

export default function Page() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [page, setPage] = React.useState(
        Number(searchParams.get('page')) || 1
    );
    const [pageSize, setPageSize] = React.useState(
        Number(searchParams.get('pageSize')) || 50
    );
    const [keyword, setKeyword] = React.useState(searchParams.get('q') || '');

    const { rows, pagination, isLoading, isError, refetch } = useAttractionRow(
        page,
        pageSize,
        keyword
    );

    React.useEffect(() => {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('pageSize', String(pageSize));
        if (keyword) params.set('q', keyword);
        router.replace(`?${params.toString()}`);
    }, [page, pageSize, keyword, router]);

    const currentQuery = `?page=${page}&pageSize=${pageSize}${
        keyword ? `&q=${encodeURIComponent(keyword)}` : ''
    }`;

    if (isLoading) return <GlobalLoading />;
    if (isError) return <p className="p-6">載入失敗</p>;

    return (
        <DataTable
            data={rows}
            pagination={pagination}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            searchValue={keyword}
            onSearch={(kw) => {
                setKeyword(kw);
                setPage(1);
            }}
            visibleKeys={[
                'imageUrl',
                'nameZh',
                'nameEn',
                'content',
                'region',
                'country',
                'city',
                'enabled',
            ]}
            columnLabels={{
                imageUrl: '圖片',
                nameZh: '中文名',
                nameEn: '英文名',
                content: '內容',
                region: '地區',
                country: '國家',
                city: '城市',
                enabled: '啟用',
                actions: '操作',
            }}
            onDelete={async (id) => {
                const res = await deleteAttraction(id);
                if (res?.error) throw new Error(res.error);
                return res;
            }}
            onRefresh={refetch}
            getEditHref={(id) => `/admin/attraction/${id}${currentQuery}`}
            addButtonLabel="新增景點"
            addButtonHref={`/admin/attraction/new${currentQuery}`}
        />
    );
}

'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import GlobalLoading from '@/components/GlobalLoading';
import { DataTable } from '@/components/DataTable';
import { deleteLexicon } from '@/app/admin/dictionary/action/dictionary';
import useLexiconRow from '@/features/lexicon/hooks/useLexiconRow';

export default function Page() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [page, setPage] = React.useState(
        Number(searchParams.get('page')) || 1
    );
    const [pageSize, setPageSize] = React.useState(
        Number(searchParams.get('pageSize')) || 50
    );

    const { rows, pagination, isLoading, isError, refetch } = useLexiconRow(
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
            visibleKeys={['title', 'type', 'context']}
            columnLabels={{
                title: '標題',
                type: '類型',
                context: '內容',
                actions: '操作',
            }}
            onDelete={async (id) => {
                const res = await deleteLexicon(id);
                if (res?.error) throw new Error(res.error);
                return res;
            }}
            onRefresh={refetch}
            getEditHref={(id) => `/admin/dictionary/${id}${currentQuery}`}
            addButtonLabel="新增辭庫"
            addButtonHref={`/admin/dictionary/new${currentQuery}`}
        />
    );
}

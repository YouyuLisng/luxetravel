'use client';

import * as React from 'react';
import GlobalLoading from '@/components/GlobalLoading';
import { DataTable } from '@/components/DataTable';

import { deleteLexicon } from '@/app/admin/dictionary/action/dictionary';
import useLexiconRow from '@/features/lexicon/hooks/useLexiconRow';

export default function Page() {
    const { rows, isLoading, isError, refetch } = useLexiconRow();

    if (isLoading) return <GlobalLoading />;
    if (isError) return <p className="p-6">載入失敗</p>;

    return (
        <>
            <DataTable
                data={rows}
                visibleKeys={[
                    'title',
                    'type',
                    'context',
                    'createdAt',
                    'updatedAt',
                ]}
                columnLabels={{
                    title: '標題',
                    type: '類型',
                    context: '內容',
                    createdAt: '建立時間',
                    updatedAt: '更新時間',
                    actions: '操作',
                }}
                onDelete={async (id) => {
                    const res = await deleteLexicon(id);
                    if (res?.error) throw new Error(res.error);
                    return res;
                }}
                onRefresh={refetch}
                getEditHref={(id) => `/admin/dictionary/${id}`}
                addButtonLabel="新增詞條"
                addButtonHref="/admin/dictionary/new"
            />
        </>
    );
}

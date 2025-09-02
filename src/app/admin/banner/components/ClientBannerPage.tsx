'use client';

import * as React from 'react';
import { useBannerQuery } from '@/features/banner/hooks/useBanner';
import BannerForm from '@/app/admin/banner/components/BannerForm';
import GlobalLoading from '@/components/GlobalLoading';

type ClientBannerPageProps = { id: string };

export default function ClientBannerPage({ id }: ClientBannerPageProps) {
    // 用你的 hooks 抓單筆
    const { data, isLoading, isError, error, refetch } = useBannerQuery(id);

    if (isLoading) {
        return (
            <div className="p-6">
                <GlobalLoading />
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="p-6 space-y-3">
                <p className="text-red-600">
                    讀取失敗：{(error as Error)?.message ?? 'Unknown error'}
                </p>
                <button
                    className="px-3 py-2 rounded-md bg-slate-900 text-white"
                    onClick={() => refetch()}
                >
                    重新整理
                </button>
            </div>
        );
    }

    const initialData = {
        id: data.id,
        imageUrl: data.imageUrl ?? '',
        title: data.title ?? '',
        subtitle: data.subtitle ?? null,
        linkText: data.linkText ?? null,
        linkUrl: data.linkUrl ?? null,
        order: data.order ?? 0,
    };

    return <BannerForm initialData={initialData} method="PUT" />;
}

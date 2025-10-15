'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import GlobalLoading from '@/components/GlobalLoading';
import { DataTable } from '@/components/DataTable';
import useTourProductRows from '@/features/product/hooks/useTourProductRows';
import {
    deleteTourProduct,
    toggleFeatured,
} from '@/app/admin/product/action/product';
import { useTourProductSearch } from '@/features/product/queries/tourProductQueries';

export default function GroupTourProductTable() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // 預設從 URL query 讀取 page/pageSize & q
    const [page, setPage] = React.useState(
        Number(searchParams.get('page')) || 1
    );
    const [pageSize, setPageSize] = React.useState(
        Number(searchParams.get('pageSize')) || 50
    );
    const [keyword, setKeyword] = React.useState(searchParams.get('q') || '');

    // ✅ 分頁查詢：限定 GROUP
    const {
        rows,
        pagination,
        isLoading: isListLoading,
        isError: isListError,
        refetch,
    } = useTourProductRows(page, pageSize, 'GROUP');

    // 搜尋查詢（目前還是查全部，你若要只搜尋 GROUP，要後端 API 支援 type 過濾）
    const {
        data: searchRows = [],
        isLoading: isSearchLoading,
        isError: isSearchError,
    } = useTourProductSearch(keyword);

    // 當 page/pageSize/keyword 改變時更新 URL
    React.useEffect(() => {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('pageSize', String(pageSize));
        if (keyword) params.set('q', keyword);
        router.replace(`?${params.toString()}`);
    }, [page, pageSize, keyword, router]);

    const currentQuery = searchParams.toString()
        ? `?${searchParams.toString()}`
        : '';

    const loading = isListLoading || isSearchLoading;
    const error = isListError || isSearchError;

    if (loading) return <GlobalLoading />;
    if (error) return <p className="p-6">載入失敗</p>;

    // 如果有關鍵字 → 使用 searchRows（這裡目前不分 type）
    const tableData = keyword ? searchRows : rows;

    return (
        <DataTable
            data={tableData}
            visibleKeys={[
                'code',
                'name',
                'arriveCountry',
                'days',
                'nights',
                'category',
                'priceMin',
                'priceMax',
                'status',
                'isFeatured',
            ]}
            columnLabels={{
                code: '行程編號',
                name: '產品名稱',
                arriveCountry: '抵達國家',
                days: '天數',
                nights: '晚數',
                category: '類別',
                priceMin: '最低價',
                priceMax: '最高價',
                status: '狀態',
                isFeatured: '精選',
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
            getEditHref={(id) => `/admin/product/${id}/wizard${currentQuery}`}
            addButtonLabel="新增團體產品"
            addButtonHref={`/admin/product/new${currentQuery}`}
            pagination={
                keyword
                    ? {
                          page: 1,
                          pageSize: searchRows.length,
                          total: searchRows.length,
                          pageCount: 1,
                      }
                    : pagination
            }
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            searchValue={keyword}
            onSearch={(q) => {
                setKeyword(q);
                setPage(1);
            }}
        />
    );
}

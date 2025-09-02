// app/(admin)/admin/travel-article/[id]/page.tsx
import type { Metadata } from 'next';
import {
    HydrationBoundary,
    dehydrate,
    QueryClient,
} from '@tanstack/react-query';

import {
    travelArticleQuery,
    type TravelArticleEntity,
} from '@/features/travelArticle/queries/travelArticleQueries';

import TravelArticleForm from '../components/TravelArticleForm';

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    return { title: `Travel Article - ${id}` };
}

export default async function Page({ params }: Props) {
    const { id } = await params;

    const queryClient = new QueryClient();
    const articleQ = travelArticleQuery(id);

    // 預抓單筆文章
    await queryClient.prefetchQuery(articleQ);

    // 從快取拿出預取資料
    const data = queryClient.getQueryData<TravelArticleEntity>(
        articleQ.queryKey
    );

    // 轉成表單期望的型別（含 countries，表單會自動轉成 countryIds）
    const initialData = data
        ? {
              id: data.id,
              title: data.title,
              subtitle: data.subtitle,
              linkUrl: data.linkUrl,
              imageUrl: data.imageUrl,
              countries: data.countries?.map((c) => ({
                  id: c.id,
                  name: c.name,
                  nameZh: c.nameZh,
              })),
          }
        : undefined;
    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <TravelArticleForm mode="edit" initialData={initialData} />
        </HydrationBoundary>
    );
}

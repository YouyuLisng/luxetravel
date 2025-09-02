// app/(admin)/admin/concern/[id]/page.tsx
import type { Metadata } from 'next';
import {
    HydrationBoundary,
    dehydrate,
    QueryClient,
} from '@tanstack/react-query';

import TravelConcernForm from '@/app/admin/concern/components/TravelConcernForm';
import {
    travelConcernQuery,
    type TravelConcernEntity,
} from '@/features/travelConcern/queries/travelConcernQuery';

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    return { title: `Concern - ${id}` };
}

export default async function Page({ params }: Props) {
    const { id } = await params;

    const queryClient = new QueryClient();
    const query = travelConcernQuery(id);

    // 預抓單筆 Concern
    await queryClient.prefetchQuery(query);

    // 從快取取出預取資料
    const data = queryClient.getQueryData<TravelConcernEntity>(query.queryKey);

    // 轉成表單期望的型別
    // TravelConcernForm 需要的 initialData 主要是：id、moduleId(可有可無/編輯不會改)、number、content、order
    const initialData = data
        ? {
              id: data.id,
              moduleId: data.moduleId,
              number: data.number,
              content: data.content,
              order: data.order,
          }
        : undefined;

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <TravelConcernForm mode="edit" initialData={initialData} />
        </HydrationBoundary>
    );
}

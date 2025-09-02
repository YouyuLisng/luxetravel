// app/(admin)/admin/advantage/[id]/page.tsx
import type { Metadata } from 'next';
import {
    HydrationBoundary,
    dehydrate,
    QueryClient,
} from '@tanstack/react-query';

import AdvantageForm from '@/app/admin/advantage/components/AdvantageForm';
import {
    travelAdvantageQuery,
    type TravelAdvantageEntity,
} from '@/features/travelAdvantage/queries/travelAdvantageQuery';
import { db } from '@/lib/db';

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const advantage = await db.travelAdvantage.findUnique({
        where: {
            id
        }
    })
    return { title: `典藏優勢 - ${advantage?.title}` };
}

export default async function Page({ params }: Props) {
    const { id } = await params;

    const queryClient = new QueryClient();
    const query = travelAdvantageQuery(id);

    await queryClient.prefetchQuery(query);
    const data = queryClient.getQueryData<TravelAdvantageEntity>(
        query.queryKey
    );

    const initialData = data
        ? {
              id: data.id,
              moduleId: data.moduleId,
              imageUrl: data.imageUrl,
              title: data.title,
              content: data.content,
          }
        : undefined;
    
    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <AdvantageForm mode="edit" initialData={initialData} />
        </HydrationBoundary>
    );
}

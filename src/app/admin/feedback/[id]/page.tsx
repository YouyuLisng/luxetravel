// app/(admin)/admin/feedback/[id]/page.tsx
import type { Metadata } from 'next';
import {
    HydrationBoundary,
    dehydrate,
    QueryClient,
} from '@tanstack/react-query';
import {
    feedbackDetailQuery,
    type FeedbackEntity,
} from '@/features/feedback/queries/feedbackQueries';
import FeedbackForm from '../components/FeedbackForm';

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    return { title: `Feedback - ${id}` };
}

export default async function Page({ params }: Props) {
    const { id } = await params;

    const queryClient = new QueryClient();
    const q = feedbackDetailQuery(id);

    await queryClient.prefetchQuery(q);

    const data = queryClient.getQueryData<FeedbackEntity>(q.queryKey);
    const initialData = data
        ? {
              id: data.id,
              title: data.title,
              subtitle: data.subtitle ?? '',
              content: data.content ?? '',
              nickname: data.nickname,
              imageUrl: data.imageUrl,
              linkUrl: data.linkUrl,
              linekName: data.linekName ?? '',
              order: data.order,
              countries:
                  data.countries?.map((c) => ({
                      id: c.id,
                      name: c.name,
                      nameZh: c.nameZh,
                  })) ?? [],
          }
        : undefined;

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <FeedbackForm mode="edit" initialData={initialData} />
        </HydrationBoundary>
    );
}

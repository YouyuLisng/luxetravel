// app/(admin)/admin/testimonial/[id]/page.tsx
import type { Metadata } from 'next';
import {
    HydrationBoundary,
    dehydrate,
    QueryClient,
} from '@tanstack/react-query';

import {
    testimonialQuery,
    type TestimonialEntity,
} from '@/features/testimonial/queries/testimonialQueries';

import TestimonialForm from '../components/TestimonialForm';

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    return { title: `Testimonial - ${id}` };
}

export default async function Page({ params }: Props) {
    const { id } = await params;

    const queryClient = new QueryClient();
    const query = testimonialQuery(id);

    // 預取單筆 Testimonial
    await queryClient.prefetchQuery(query);

    // 取得預取資料
    const data = queryClient.getQueryData<TestimonialEntity>(query.queryKey);

    const initialData = data
        ? {
              id: data.id,
              mode: data.mode,
              nickname: data.nickname ?? null,
              stars: data.stars ?? null,
              content: data.content,
              linkUrl: data.linkUrl ?? null,
              order: typeof data.order === 'number' ? data.order : 0,
          }
        : undefined;

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <TestimonialForm initialData={initialData} method="PUT" />
        </HydrationBoundary>
    );
}

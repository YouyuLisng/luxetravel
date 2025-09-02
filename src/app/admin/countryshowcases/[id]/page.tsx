// app/(admin)/admin/countryshowcases/[id]/page.tsx
import CountryShowcaseForm from '@/app/admin/countryshowcases/components/CountryShowcaseForm';
import type { Metadata } from 'next';
import {
    HydrationBoundary,
    dehydrate,
    QueryClient,
} from '@tanstack/react-query';
import {
    type CountryShowcaseEntity,
    countryShowcaseQuery,
} from '@/features/countryShowcase/queries/countryShowcaseQueries';

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    return { title: `CountryShowcase - ${id}` };
}

export default async function Page({ params }: Props) {
    const { id } = await params;

    const queryClient = new QueryClient();
    const query = countryShowcaseQuery(id);

    // 預取單筆 CountryShowcase
    await queryClient.prefetchQuery(query);

    // 直接從快取拿預取資料，丟給表單做預設值
    const data = queryClient.getQueryData<CountryShowcaseEntity>(
        query.queryKey
    );

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <CountryShowcaseForm
                initialData={data}
                method="PUT"
            />
        </HydrationBoundary>
    );
}

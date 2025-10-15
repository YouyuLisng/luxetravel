// app/(admin)/admin/module/[id]/page.tsx
import type { Metadata } from 'next';
import {
    HydrationBoundary,
    dehydrate,
    QueryClient,
} from '@tanstack/react-query';
import ModuleForm from '@/app/admin/modules/components/ModuleForm';
import {
    moduleQuery,
    type ModuleEntity,
} from '@/features/module/queries/modulesQuery';

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    return { title: `Module - ${id}` };
}

export default async function Page({ params }: Props) {
    const { id } = await params;

    const queryClient = new QueryClient();
    const query = moduleQuery(id);

    // 預抓單筆 Module
    await queryClient.prefetchQuery(query);

    // 從快取取出預取資料
    const data = queryClient.getQueryData<ModuleEntity>(query.queryKey);

    // 轉成表單期望的型別（type 需是 'ADVANTAGE' | 'CONCERN' | undefined）
    const initialData = data
        ? {
              ...data,
              type: data.type as 'ADVANTAGE' | 'CONCERN' | undefined,
          }
        : undefined;

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <ModuleForm mode="edit" initialData={initialData} />
        </HydrationBoundary>
    );
}

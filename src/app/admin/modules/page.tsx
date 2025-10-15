// app/(admin)/admin/module/page.tsx
import {
    HydrationBoundary,
    dehydrate,
    QueryClient,
} from '@tanstack/react-query';
import { modulesQuery } from '@/features/module/queries/modulesQuery';
import ModuleTableClient from '@/app/admin/modules/components/ModuleTable';

export default async function Page() {
    const qc = new QueryClient();

    // 預取 modules 列表
    await qc.prefetchQuery(modulesQuery());

    return (
        <HydrationBoundary state={dehydrate(qc)}>
            <ModuleTableClient />
        </HydrationBoundary>
    );
}

'use client';
import { ModuleDataTable } from '@/app/admin/modules/components/data-table';
import { useQuery } from '@tanstack/react-query';
import { modulesQuery } from '@/features/module/queries/modulesQuery';
import GlobalLoading from '@/components/GlobalLoading';

export default function ModuleTableClient() {
  const { data, isLoading, isError } = useQuery(modulesQuery());

  if (isLoading) return <GlobalLoading />;
  if (isError) return <p className="p-6">載入失敗</p>;

  return <ModuleDataTable data={data ?? []} />;
}

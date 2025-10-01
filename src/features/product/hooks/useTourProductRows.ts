'use client';

import { useQuery } from '@tanstack/react-query';
import { tourProductsQuery } from '@/features/product/queries/tourProductQueries';

export default function useTourProductRows(
  page: number,
  pageSize: number,
  type?: string
) {
  const { data, isLoading, isError, error, refetch } = useQuery(
    tourProductsQuery(page, pageSize, type)
  );

  return {
    rows: data?.rows ?? [],
    pagination: data?.pagination,
    isLoading,
    isError,
    error,
    refetch,
  };
}

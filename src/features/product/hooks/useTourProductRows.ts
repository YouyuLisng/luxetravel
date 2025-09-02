import { useTourProducts } from '../queries/tourProductQueries';

export default function useTourProductRows() {
    const { data, isLoading, isError, refetch } = useTourProducts();

    return {
        rows: data ?? [],
        isLoading,
        isError,
        refetch,
    };
}

import { useTourProduct } from '../queries/tourProductQueries';

export default function useTourProductData(id: string) {
    const { data, isLoading, isError, refetch } = useTourProduct(id);

    return {
        data,
        isLoading,
        isError,
        refetch,
    };
}

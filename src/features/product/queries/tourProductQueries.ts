import { useQuery } from '@tanstack/react-query';
import { queryOptions } from '@tanstack/react-query';

export const KEYS = {
    all: ['tourProduct'] as const,
    list: () => [...KEYS.all, 'list'] as const,
    detail: (id: string) => [...KEYS.all, 'detail', id] as const,
};

export type TourProductEntity = {
    id: string;
    code: string;
    namePrefix: string | null;
    name: string;
    description: string | null;
    days: number;
    nights: number;
    departAirport: string;
    arriveCountry: string;
    arriveCity: string;
    arriveAirport: string;
    category: string;
    priceMin: number;
    priceMax: number | null;
    tags: string[];
    note: string | null;
    status: number;
    staff: string | null;
    reminder: string | null;
    policy: string | null;
    createdAt: string;
    updatedAt: string;
};

/** 單筆查詢 */
export const tourProductQuery = (id: string) =>
    queryOptions({
        queryKey: KEYS.detail(id),
        queryFn: async (): Promise<TourProductEntity> => {
            const res = await fetch(`/api/admin/product/${id}`, {
                cache: 'no-store',
            });
            if (!res.ok) throw new Error('取得產品失敗');
            const { data } = await res.json();
            return data as TourProductEntity;
        },
    });

/** 全部查詢 */
export const tourProductsQuery = queryOptions({
    queryKey: KEYS.list(),
    queryFn: async (): Promise<TourProductEntity[]> => {
        const res = await fetch(`/api/admin/product`, { cache: 'no-store' });
        if (!res.ok) throw new Error('取得產品列表失敗');
        const { data } = await res.json();
        return data as TourProductEntity[];
    },
});

/** hook：取得全部 */
export function useTourProducts() {
    return useQuery(tourProductsQuery);
}

/** hook：取得單筆 */
export function useTourProduct(id: string) {
    return useQuery(tourProductQuery(id));
}

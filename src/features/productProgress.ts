import { useQuery } from '@tanstack/react-query';
import {
    getProductProgress,
    type ProductProgress,
} from '@/app/admin/product/action/productProgress';

export const PRODUCT_PROGRESS_KEY = (productId: string) => [
    'product-progress',
    productId,
];

export function useProductProgress(productId: string) {
    return useQuery<ProductProgress | { error: string }>({
        queryKey: PRODUCT_PROGRESS_KEY(productId),
        queryFn: () => getProductProgress(productId),
        staleTime: 1000 * 60 * 5, // 5分鐘內不重抓
        refetchOnWindowFocus: false,
    });
}

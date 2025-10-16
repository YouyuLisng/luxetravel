'use client';

import { useState, useEffect } from 'react';
import {
    getProductProgress,
    publishProduct,
    type ProductProgress,
} from '@/app/admin/product/action/productProgress';
import { Button } from '@/components/ui/button';
import TourProductForm from './TourProductForm';
import FlightForm from '../[id]/tour/components/FlightForm';
import ItineraryForm from '../[id]/tour/components/ItineraryForm';
import { useSearchParams, usePathname } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useLoadingStore } from '@/stores/useLoadingStore';
import TourForm from '../[id]/tour/components/TourForm';
import TourMapForm from '../[id]/tour/components/TourMapForm';
import TourHighlightForm from '../[id]/tour/components/TourHighlightForm';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import FormError from '@/components/auth/FormError';
import FormSuccess from '@/components/auth/FormSuccess';

type Props = {
    productId: string;
    tourProduct: any;
    data: any;
};

const steps = [
    { id: 'product', label: '產品' },
    { id: 'flight', label: '航班' },
    { id: 'itinerary', label: '行程表' },
    { id: 'highlight', label: '焦點特色' },
    { id: 'map', label: '地圖' },
    { id: 'tours', label: '團次' },
];

export default function ProductWizard({ productId, tourProduct, data }: Props) {
    const searchParams = useSearchParams();
    const pathname = usePathname(); // ✅ 取得當前網址
    const { show, hide } = useLoadingStore();
    const queryClient = useQueryClient();

    // ✅ 判斷是否為自由行類型
    const isFreeWizard = pathname?.includes('/wizard/free');

    const stepParam = searchParams.get('step') ?? 'product';
    const [currentStep, setCurrentStep] = useState(stepParam);

    const [error, setError] = useState<string>();
    const [success, setSuccess] = useState<string>();

    const handleStepChange = (stepId: string) => {
        setCurrentStep(stepId);
        const params = new URLSearchParams(searchParams);
        params.set('step', stepId);
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState(null, '', newUrl);
    };

    useEffect(() => {
        setCurrentStep(stepParam);
    }, [stepParam]);

    const {
        data: progress,
        isLoading: progressLoading,
        isError,
    } = useQuery<ProductProgress>({
        queryKey: ['product-progress', productId],
        queryFn: () => getProductProgress(productId) as Promise<ProductProgress>,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });

    if (progressLoading) {
        return <p className="p-6">載入進度中...</p>;
    }

    if (!progress || isError || 'error' in progress) {
        return <p className="p-6 text-red-600">無法載入進度</p>;
    }

    // ✅ 動態生成可顯示的步驟（free 時移除 highlight / tours）
    const visibleSteps = isFreeWizard
        ? steps.filter((s) => !['highlight', 'tours'].includes(s.id))
        : steps;

    return (
        <div className="flex flex-col w-full min-h-[600px]">
            <Tabs value={currentStep} onValueChange={handleStepChange}>
                {/* Tabs 列表 */}
                <TabsList className="mb-4">
                    {visibleSteps.map((step) => (
                        <TabsTrigger key={step.id} value={step.id}>
                            <div className="flex items-center space-x-1">
                                <span>{step.label}</span>
                                {/* <span>
                                    {progress[
                                        step.id as keyof ProductProgress
                                    ] ?? '⭕'}
                                </span> */}
                            </div>
                        </TabsTrigger>
                    ))}
                </TabsList>

                {/* 進度條 */}
                <div className="mb-6">
                    <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-slate-700">
                            完成度
                        </span>
                        <span className="text-sm font-medium text-slate-700">
                            {progress.percent}%
                        </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${progress.percent}%` }}
                        />
                    </div>
                </div>

                {/* 每個步驟對應內容 */}
                <TabsContent value="product">
                    <TourProductForm
                        id={productId}
                        method="PUT"
                        initialData={tourProduct}
                    />
                </TabsContent>

                <TabsContent value="flight">
                    <FlightForm
                        productId={productId}
                        initialData={data.flights}
                    />
                </TabsContent>

                <TabsContent value="itinerary">
                    <ItineraryForm
                        productId={productId}
                        initialData={data.itineraries}
                    />
                </TabsContent>

                {/* ✅ 非自由行才顯示「焦點特色」 */}
                {!isFreeWizard && (
                    <TabsContent value="highlight">
                        <TourHighlightForm
                            productId={productId}
                            initialData={data.highlights}
                        />
                    </TabsContent>
                )}

                <TabsContent value="map">
                    <TourMapForm productId={productId} initialData={data.map} />
                </TabsContent>

                {/* ✅ 非自由行才顯示「團次」 */}
                {!isFreeWizard && (
                    <TabsContent value="tours">
                        <TourForm
                            productId={productId}
                            productCode={tourProduct.code}
                            productDays={data.days}
                            initialData={data.tour}
                            initialDates={
                                data.tour?.map(
                                    (t: any) => new Date(t.departDate)
                                ) ?? []
                            }
                        />
                        {/* <div className="mt-6 flex justify-end">
                            <Button onClick={handlePublish} disabled={loading}>
                                完成並上架
                            </Button>
                        </div> */}
                    </TabsContent>
                )}
            </Tabs>

            <FormError message={error} />
            <FormSuccess message={success} />
        </div>
    );
}

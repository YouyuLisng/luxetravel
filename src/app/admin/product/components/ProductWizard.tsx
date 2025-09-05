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
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useLoadingStore } from '@/stores/useLoadingStore';
import TourForm from '../[id]/tour/components/TourForm';
import { useQuery, useQueryClient } from '@tanstack/react-query';

type Props = {
    productId: string;
    tourProduct: any;
    data: any;
};

const steps = [
    { id: 'product', label: '產品' },
    { id: 'flight', label: '航班' },
    { id: 'itinerary', label: '行程表' },
    { id: 'highlight', label: '亮點&地圖' },
    { id: 'tours', label: '團次' },
];

export default function ProductWizard({ productId, tourProduct, data }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { show, hide } = useLoadingStore();
    const queryClient = useQueryClient();

    const stepParam = searchParams.get('step') ?? 'product';
    const [currentStep, setCurrentStep] = useState(stepParam);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();
    const [success, setSuccess] = useState<string>();

    const handleStepChange = (stepId: string) => {
        setCurrentStep(stepId);
        const params = new URLSearchParams(searchParams);
        params.set('step', stepId);
        const newUrl = `?${params.toString()}`;
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
        queryFn: () =>
            getProductProgress(productId) as Promise<ProductProgress>,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });

    const handlePublish = async () => {
        setError(undefined);
        setSuccess(undefined);
        setLoading(true);
        try {
            show();
            const res = await publishProduct(productId);
            if ('error' in res) {
                setError(res.error);
            } else {
                setSuccess(res.success);
                queryClient.invalidateQueries({
                    queryKey: ['product-progress', productId],
                });
            }
        } finally {
            setLoading(false);
            hide();
        }
    };

    if (progressLoading) {
        return <p className="p-6">載入進度中...</p>;
    }

    if (!progress || isError || 'error' in progress) {
        return <p className="p-6 text-red-600">無法載入進度</p>;
    }

    return (
        <div className="flex flex-col w-full min-h-[600px]">
            <Tabs value={currentStep} onValueChange={handleStepChange}>
                {/* Tabs 列表 */}
                <TabsList className="mb-4">
                    {steps.map((step) => (
                        <TabsTrigger key={step.id} value={step.id}>
                            <div className="flex items-center space-x-1">
                                <span>{step.label}</span>
                                <span>
                                    {progress[
                                        step.id as keyof ProductProgress
                                    ] ?? '⭕'}
                                </span>
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
                <div hidden={currentStep !== 'product'}>
                    <TourProductForm
                        id={productId}
                        method="PUT"
                        initialData={tourProduct}
                    />
                </div>

                <div hidden={currentStep !== 'flight'}>
                    <FlightForm
                        productId={productId}
                        initialData={data.flights}
                    />
                </div>

                <div hidden={currentStep !== 'itinerary'}>
                    <ItineraryForm
                        productId={productId}
                        initialData={data.itineraries}
                    />
                </div>

                <div hidden={currentStep !== 'highlight'}>
                    <h2 className="text-lg font-semibold mb-2">亮點與地圖</h2>
                </div>

                <div hidden={currentStep !== 'tours'}>
                    <h2 className="text-lg font-semibold mb-2">團次設定</h2>
                    <div>
                        <TourForm id={productId} initialData={data.tour} />
                    </div>
                    <div className="mt-6 flex justify-end">
                        <Button onClick={handlePublish} disabled={loading}>
                            完成並上架
                        </Button>
                    </div>
                </div>
            </Tabs>

            {error && <p className="mt-4 text-red-600">{error}</p>}
            {success && <p className="mt-4 text-green-600">{success}</p>}
        </div>
    );
}

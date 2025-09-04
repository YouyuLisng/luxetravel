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

    const stepParam = searchParams.get('step') ?? 'product';
    const [currentStep, setCurrentStep] = useState(stepParam);

    const [progress, setProgress] = useState<ProductProgress | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();
    const [success, setSuccess] = useState<string>();

    const handleStepChange = (stepId: string) => {
        setCurrentStep(stepId);
        const params = new URLSearchParams(searchParams);
        params.set('step', stepId);
        router.replace(`?${params.toString()}`);
    };

    useEffect(() => {
        setCurrentStep(stepParam);
    }, [stepParam]);

    useEffect(() => {
        let mounted = true;
        async function fetchProgress() {
            try {
                show();
                const res = await getProductProgress(productId);
                if (!mounted) return;
                if ('error' in res) {
                    setError(res.error);
                } else {
                    setProgress(res);
                }
            } finally {
                hide();
            }
        }
        fetchProgress();
        return () => {
            mounted = false;
            hide();
        };
    }, [productId, currentStep, show, hide]);

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
            }
        } finally {
            setLoading(false);
            hide();
        }
    };

    if (!progress) {
        return null;
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
                                    {progress
                                        ? progress[
                                              step.id as keyof ProductProgress
                                          ]
                                        : '⭕'}
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
                <TabsContent value="product">
                    <TourProductForm
                        id={productId}
                        method="PUT"
                        initialData={tourProduct}
                    />
                </TabsContent>

                <TabsContent value="flight">
                    <FlightForm productId={productId} initialData={data.flights} />
                </TabsContent>

                <TabsContent value="itinerary">
                    <ItineraryForm
                        productId={productId}
                        initialData={data.itineraries}
                    />
                </TabsContent>

                <TabsContent value="highlight">
                    <div>
                        <h2 className="text-lg font-semibold mb-2">
                            亮點與地圖
                        </h2>
                    </div>
                </TabsContent>

                <TabsContent value="tours">
                    <div>
                        <h2 className="text-lg font-semibold mb-2">團次設定</h2>
                        <div className="mt-6 flex justify-end">
                            <Button onClick={handlePublish} disabled={loading}>
                                完成並上架
                            </Button>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {error && <p className="mt-4 text-red-600">{error}</p>}
            {success && <p className="mt-4 text-green-600">{success}</p>}
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import {
    getProductProgress,
    publishProduct,
    type ProductProgress,
} from '@/app/admin/product/action/productProgress';
import { Button } from '@/components/ui/button';
import clsx from 'clsx';
import TourProductForm from './TourProductForm';
import FlightForm from '../[id]/tour/components/FlightForm';
import ItineraryForm from '../[id]/tour/components/ItineraryForm';

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
    const [currentStep, setCurrentStep] = useState('product');
    const [progress, setProgress] = useState<ProductProgress | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();
    const [success, setSuccess] = useState<string>();

    // 進度檢查
    useEffect(() => {
        async function fetchProgress() {
            const res = await getProductProgress(productId);
            if ('error' in res) {
                setError(res.error);
            } else {
                setProgress(res);
            }
        }
        fetchProgress();
    }, [productId, currentStep]);

    // 最後上架
    const handlePublish = async () => {
        setError(undefined);
        setSuccess(undefined);
        setLoading(true);
        try {
            const res = await publishProduct(productId);
            if ('error' in res) {
                setError(res.error);
            } else {
                setSuccess(res.success);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex w-full min-h-[600px]">
            {/* 左側步驟條 */}
            <div className="w-48 border-r p-4 space-y-2">
                {steps.map((step) => (
                    <button
                        key={step.id}
                        onClick={() => setCurrentStep(step.id)}
                        className={clsx(
                            'w-full flex justify-between px-3 py-2 rounded-md text-left text-sm',
                            currentStep === step.id
                                ? 'bg-blue-50 text-blue-600'
                                : 'hover:bg-slate-50'
                        )}
                    >
                        <span>{step.label}</span>
                        <span>
                            {progress
                                ? progress[step.id as keyof ProductProgress]
                                : '⭕'}
                        </span>
                    </button>
                ))}
            </div>

            {/* 右側內容區 */}
            <div className="flex-1 p-6">
                {/* 進度條 */}
                {progress && (
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
                )}

                {currentStep === 'product' && (
                    <TourProductForm
                        id={productId}
                        method="PUT"
                        initialData={tourProduct}
                    />
                )}
                {currentStep === 'flight' && (
                    <FlightForm productId={productId} />
                )}
                {currentStep === 'itinerary' && (
                    <ItineraryForm productId={productId} initialData={data.itineraries} />
                )}
                {currentStep === 'highlight' && (
                    <div>
                        <h2 className="text-lg font-semibold mb-2">
                            亮點與地圖
                        </h2>
                    </div>
                )}
                {currentStep === 'tours' && (
                    <div>
                        <h2 className="text-lg font-semibold mb-2">團次設定</h2>
                        <div className="mt-6 flex justify-end">
                            <Button onClick={handlePublish} disabled={loading}>
                                完成並上架
                            </Button>
                        </div>
                    </div>
                )}

                {error && <p className="mt-4 text-red-600">{error}</p>}
                {success && <p className="mt-4 text-green-600">{success}</p>}
            </div>
        </div>
    );
}

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

import TourForm, { TourFormValues } from '../components/TourForm';
import FlightForm, { FlightFormValues } from '../components/FlightForm';
import TourMapForm, { TourMapFormValues } from '../components/TourMapForm';
import TourHighlightForm, {
    TourHighlightFormValues,
} from '../components/TourHighlightForm';
import ItineraryForm, {
    ItineraryFormValues,
} from '../components/ItineraryForm';

import { createFullProduct } from '@/app/admin/product/action/fullProduct';

export default function ProductWizard({ product }: { product: any }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    // 狀態：收集五個子表單的資料
    const [tour, setTour] = useState<TourFormValues>(product);
    const [flights, setFlights] = useState<FlightFormValues['flights']>(
        product.flights ?? []
    );
    const [map, setMap] = useState<TourMapFormValues>(product.maps?.[0]);
    const [highlights, setHighlights] = useState<
        TourHighlightFormValues['highlights']
    >(product.highlights ?? []);
    const [itineraries, setItineraries] = useState<
        ItineraryFormValues['itineraries']
    >(product.itineraries ?? []);

    const handleSubmitAll = () => {
        startTransition(async () => {
            const res = await createFullProduct({
                tour,
                flights,
                map,
                highlights,
                itineraries,
            });

            if (res.error) {
                alert(res.error);
            } else {
                alert('更新成功！');
                router.push('/admin/product');
            }
        });
    };

    return (
        <div className="space-y-8">
            <TourForm
                id={product.id}
                method="POST"
                initialData={product.tour}
                onChange={setTour}
            />
            <FlightForm
                productId={product.id}
                method="POST"
                initialData={product.flights}
                onChange={setFlights}
            />
            <TourMapForm
                productId={product.id}
                method="POST"
                initialData={product.maps[0]}
                onChange={setMap}
            />
            <TourHighlightForm
                productId={product.id}
                method="POST"
                initialData={product.highlights}
                onChange={setHighlights}
            />
            <ItineraryForm
                productId={product.id}
                method="POST"
                initialData={product.itineraries}
                onChange={setItineraries}
            />

            <div className="flex justify-end">
                <Button disabled={isPending} onClick={handleSubmitAll}>
                    送出需求
                </Button>
            </div>
        </div>
    );
}

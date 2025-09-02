import { db } from '@/lib/db';
import TourForm from '../components/TourForm';
import FlightForm from '../components/FlightForm';
import { Suspense } from 'react';

interface Props {
    params: Promise<{ id: string }>;
}

export default async function Page({ params }: Props) {
    const { id } = await params;
    const product = await db.tourProduct.findUnique({
        where: { id },
        include: {
            flights: true,
            itineraries: true,
            highlights: true,
            maps: true,
        },
    });

    if (!product) return <div>找不到產品</div>;

    return (
        <div className="space-y-2">
            <Suspense fallback={<div>Loading...</div>}>
                <TourForm id={id} method="POST" />
                <FlightForm productId={id} initialData={product.flights} />
            </Suspense>
        </div>
    );
}

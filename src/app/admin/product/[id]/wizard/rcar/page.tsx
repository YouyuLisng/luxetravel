import React from 'react';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import ProductWizard from '../../../components/ProductWizard';
import { getTourProductById } from '../../../action/data/getTourProductById';

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const product = await db.tourProduct.findUnique({
        where: { id },
    });
    return { title: `${product?.name} - ${product?.code}` };
}

export default async function Page({ params }: Props) {
    const { id } = await params;

    const tourProduct = await getTourProductById(id);

    const data = await db.tourProduct.findUnique({
        where: { id },
        include: {
            tour: true,
            flights: true,
            highlights: true,
            map: true,
            itineraries: {
                include: {
                    routes: true,
                    attractions: {
                        include: {
                            attraction: true,
                        },
                    },
                },
                orderBy: {
                    day: 'asc',
                },
            },
        },
    });

    return (
        <ProductWizard productId={id} tourProduct={tourProduct} data={data} />
    );
}

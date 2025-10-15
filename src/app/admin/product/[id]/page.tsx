import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import TourProductForm from '../components/TourProductForm';

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
    const product = await db.tourProduct.findUnique({
        where: { id },
    });

    if (!product) {
        notFound();
    }
    const initialData = {
        ...product,
        subCategoryId: product.subCategoryId ?? undefined,
    };
    return <TourProductForm id={id} method="PUT" initialData={initialData} />;
}

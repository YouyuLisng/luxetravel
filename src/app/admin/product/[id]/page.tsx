import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';

import TourProductForm from '@/app/admin/product/components/TourProductForm';

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    return { title: `TourProduct - ${id}` };
}

export default async function Page({ params }: Props) {
    const { id } = await params;

    const data = await db.tourProduct.findUnique({
        where: { id },
        select: {
            id: true,
            code: true,
            namePrefix: true,
            name: true,
            description: true,
            days: true,
            nights: true,
            departAirport: true,
            arriveCountry: true,
            arriveCity: true,
            arriveAirport: true,
            category: true,
            priceMin: true,
            priceMax: true,
            tags: true,
            note: true,
            status: true,
            staff: true,
            reminder: true,
            policy: true,
            categoryId: true,
            subCategoryId: true,
        },
    });

    if (!data) return notFound();

    const initialData = {
        id: data.id,
        code: data.code ?? '',
        namePrefix: data.namePrefix ?? '',
        name: data.name ?? '',
        description: data.description ?? '',
        days: data.days ?? 1,
        nights: data.nights ?? 0,
        departAirport: data.departAirport ?? '',
        arriveCountry: data.arriveCountry ?? '',
        arriveCity: data.arriveCity ?? '',
        arriveAirport: data.arriveAirport ?? '',
        category: data.category ?? '',
        priceMin: data.priceMin ?? 0,
        priceMax: data.priceMax ?? null,
        tags: data.tags ?? [],
        note: data.note ?? '',
        status: data.status ?? 1,
        staff: data.staff ?? '',
        reminder: data.reminder ?? '',
        policy: data.policy ?? '',
        categoryId: data.categoryId ?? '',
        subCategoryId: data.subCategoryId ?? '',
    };

    return <TourProductForm id={id} initialData={initialData} method="PUT" />;
}

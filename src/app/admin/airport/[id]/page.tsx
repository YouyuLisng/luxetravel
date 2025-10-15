// app/(admin)/admin/airport/[id]/page.tsx
import AirportForm from '@/app/admin/airport/components/AirportForm';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    return { title: `Airport - ${id}` };
}

export default async function Page({ params }: Props) {
    const { id } = await params;

    const data = await db.airport.findUnique({
        where: { id },
        select: {
            id: true,
            code: true,
            nameZh: true,
            nameEn: true,
            imageUrl: true,
            enabled: true,
            regionId: true,
            countryId: true,
        },
    });

    if (!data) return notFound();

    const initialData = {
        id: data.id,
        code: data.code ?? '',
        nameZh: data.nameZh ?? '',
        nameEn: data.nameEn ?? '',
        imageUrl: data.imageUrl ?? null,
        enabled: data.enabled ?? true,
        regionId: data.regionId,
        countryId: data.countryId,
    };

    return <AirportForm initialData={initialData} mode="edit" />;
}

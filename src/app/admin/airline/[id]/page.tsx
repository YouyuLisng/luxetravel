// app/(admin)/admin/airline/[id]/page.tsx
import AirlineForm from '@/app/admin/airline/components/AirlineForm';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    return { title: `Airline - ${id}` };
}

export default async function Page({ params }: Props) {
    const { id } = await params;

    const data = await db.airline.findUnique({
        where: { id },
        select: {
            id: true,
            code: true,
            nameZh: true,
            nameEn: true,
            imageUrl: true,
            enabled: true,
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
    };

    return <AirlineForm initialData={initialData} mode="edit" />;
}

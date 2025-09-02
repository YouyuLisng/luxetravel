// app/(admin)/admin/attraction/[id]/page.tsx
import AttractionForm from '@/app/admin/attraction/components/AttractionForm';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    return { title: `Attraction - ${id}` };
}

export default async function Page({ params }: Props) {
    const { id } = await params;

    const data = await db.attraction.findUnique({
        where: { id },
        select: {
            id: true,
            code: true,
            nameZh: true,
            nameEn: true,
            content: true,
            region: true,
            country: true,
            city: true,
            tags: true,
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
        content: data.content ?? '',
        region: data.region ?? '',
        country: data.country ?? '',
        city: data.city ?? '',
        tags: data.tags ?? [],
        imageUrl: data.imageUrl ?? null,
        enabled: data.enabled ?? true,
    };

    return <AttractionForm initialData={initialData} mode="edit" />;
}

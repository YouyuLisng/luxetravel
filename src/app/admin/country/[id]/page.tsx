// app/(admin)/admin/country/[id]/page.tsx
import CountryForm from '@/app/admin/country/components/CountryForm';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    return { title: `Country - ${id}` };
}

export default async function Page({ params }: Props) {
    const { id } = await params;

    const data = await db.country.findUnique({
        where: { id },
        select: {
            id: true,
            code: true,
            nameEn: true,
            nameZh: true,
            imageUrl: true,
            enabled: true,
        },
    });

    if (!data) return notFound();

    const initialData = {
        id: data.id,
        code: data.code ?? '',
        nameEn: data.nameEn ?? '',
        nameZh: data.nameZh ?? '',
        imageUrl: data.imageUrl ?? null,
        enabled: data.enabled ?? true,
    };

    return <CountryForm initialData={initialData} method="PUT" />;
}

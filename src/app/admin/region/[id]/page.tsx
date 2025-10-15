// app/(admin)/admin/region/[id]/page.tsx
import RegionForm from '@/app/admin/region/components/RegionForm';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    return { title: `地區 - ${id}` };
}

export default async function Page({ params }: Props) {
    const { id } = await params;

    const data = await db.region.findUnique({
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

    return <RegionForm initialData={initialData} method="PUT" />;
}

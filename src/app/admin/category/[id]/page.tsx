// app/(admin)/admin/category/[id]/page.tsx
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import CategoryForm from '@/app/admin/category/components/CategoryForm';

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    return { title: `大類別 - ${id}` };
}

export default async function Page({ params }: Props) {
    const { id } = await params;

    const data = await db.category.findUnique({
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

    return <CategoryForm initialData={initialData} method="PUT" />;
}

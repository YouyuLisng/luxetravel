// app/(admin)/admin/page/[id]/page.tsx
import PageForm from '@/app/admin/page/components/PageForm';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    return { title: `主題旅遊頁面 - ${id}` };
}

export default async function Page({ params }: Props) {
    const { id } = await params;

    const data = await db.page.findUnique({
        where: { id },
        include: {
            tourProducts: {
                include: {
                    tourProduct: true,
                },
            },
        },
    });

    if (!data) return notFound();

    const initialData = {
        id: data.id,
        title: data.title ?? '',
        slug: data.slug ?? '',
        content: data.content ?? '',
        seoTitle: data.seoTitle ?? '',
        seoDesc: data.seoDesc ?? '',
        seoImage: data.seoImage ?? null,
        keywords: data.keywords ?? [],
        icon: data.icon ?? null,
        activityTextEn: data.activityTextEn ?? '',
        tourProducts: data.tourProducts.map((tp) => tp.tourProduct.id),
        tourProductsDetail: data.tourProducts.map((tp) => ({
            id: tp.tourProduct.id,
            code: tp.tourProduct.code,
            name: tp.tourProduct.name,
        })),
    };

    return <PageForm initialData={initialData} mode="edit" />;
}

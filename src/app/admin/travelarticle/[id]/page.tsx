// app/(admin)/admin/travel-article/[id]/page.tsx
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import TravelArticleForm from '../components/TravelArticleForm';

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    return { title: `Travel Article - ${id}` };
}

export default async function Page({ params }: Props) {
    const { id } = await params;

    const data = await db.article.findUnique({
        where: { id },
        select: {
            id: true,
            title: true,
            subtitle: true,
            linkUrl: true,
            imageUrl: true,
            countries: {
                include: {
                    country: true,
                },
            },
        },
    });

    if (!data) return notFound();

    const initialData = {
        id: data.id,
        title: data.title ?? '',
        subtitle: data.subtitle ?? '',
        linkUrl: data.linkUrl ?? '',
        imageUrl: data.imageUrl ?? null,
        countries: data.countries.map((c) => ({
            id: c.country.id,
            name: c.country.name,
            nameZh: c.country.nameZh,
        })),
    };

    return <TravelArticleForm initialData={initialData} mode="edit" />;
}

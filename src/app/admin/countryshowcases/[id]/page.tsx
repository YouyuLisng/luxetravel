import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import CountryShowcaseForm from '../components/CountryShowcaseForm';

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    return { title: `Country Showcase - ${id}` };
}

export default async function Page({ params }: Props) {
    const { id } = await params;

    const data = await db.countryShowcase.findUnique({
        where: { id },
        select: {
            id: true,
            imageUrl: true,
            title: true,
            subtitle: true,
            description: true,
            linkUrl: true,
            order: true,
        },
    });

    if (!data) return notFound();

    const initialData = {
        id: data.id,
        imageUrl: data.imageUrl ?? '',
        title: data.title ?? '',
        subtitle: data.subtitle ?? '',
        description: data.description ?? '',
        linkUrl: data.linkUrl ?? '',
        order: data.order ?? 0,
    };

    return <CountryShowcaseForm initialData={initialData} method="PUT" />;
}

import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import CountryShowcaseForm from '../components/CountryShowcaseForm';

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const data = await db.countryShowcase.findUnique({
        where: { id },
        select: {
            id: true,
            imageUrl: true,
            imageUrl1: true,
            imageUrl2: true,
            title: true,
            subtitle: true,
            description: true,
            linkText: true,
            linkUrl: true,
            order: true,
        },
    });
    return { title: `經典卡片行程 - ${data?.title}` };
}

export default async function Page({ params }: Props) {
    const { id } = await params;

    const data = await db.countryShowcase.findUnique({
        where: { id },
        select: {
            id: true,
            imageUrl: true,
            imageUrl1: true,
            imageUrl2: true,
            title: true,
            subtitle: true,
            description: true,
            linkText: true,
            linkUrl: true,
            order: true,
        },
    });

    if (!data) return notFound();

    const initialData = {
        id: data.id,
        imageUrl: data.imageUrl ?? '',
        imageUrl1: data.imageUrl1 ?? null,
        imageUrl2: data.imageUrl2 ?? null,
        title: data.title ?? '',
        subtitle: data.subtitle ?? '',
        description: data.description ?? '',
        linkText: data.linkText ?? '',
        linkUrl: data.linkUrl ?? '',
        order: data.order ?? 0,
    };

    return <CountryShowcaseForm initialData={initialData} method="PUT" />;
}

import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import FeedbackForm from '../components/FeedbackForm';

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    return { title: `Feedback - ${id}` };
}

export default async function Page({ params }: Props) {
    const { id } = await params;

    const data = await db.feedback.findUnique({
        where: { id },
        select: {
            id: true,
            title: true,
            subtitle: true,
            content: true,
            nickname: true,
            imageUrl: true,
            linkUrl: true,
            linekName: true,
            order: true,
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
        content: data.content ?? '',
        nickname: data.nickname ?? '',
        imageUrl: data.imageUrl ?? '',
        linkUrl: data.linkUrl ?? '',
        linekName: data.linekName ?? '',
        order: data.order ?? 0,
        countries: data.countries?.map((rel) => ({
            id: rel.country.id,
            name: rel.country.name,
            nameZh: rel.country.nameZh,
            code: rel.country.code,
        })),
    };

    return <FeedbackForm initialData={initialData} mode="edit" />;
}

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
            content: true,
            nickname: true,
            imageUrl: true,
            linkUrl: true,
        },
    });

    if (!data) return notFound();

    const initialData = {
        id: data.id,
        title: data.title ?? '',
        content: data.content ?? '',
        nickname: data.nickname ?? '',
        imageUrl: data.imageUrl ?? '',
        linkUrl: data.linkUrl ?? '',
    };

    return <FeedbackForm initialData={initialData} mode="edit" />;
}

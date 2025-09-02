// app/(admin)/admin/lexicon/[id]/page.tsx
import LexiconForm from '@/app/admin/dictionary/components/LexiconForm';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    return { title: `Lexicon - ${id}` };
}

export default async function Page({ params }: Props) {
    const { id } = await params;

    const data = await db.lexicon.findUnique({
        where: { id },
        select: {
            id: true,
            title: true,
            type: true,
            context: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!data) return notFound();

    const initialData = {
        id: data.id,
        title: data.title ?? '',
        type: data.type ?? '',
        context: data.context ?? '',
    };

    return <LexiconForm initialData={initialData} mode="edit" />;
}

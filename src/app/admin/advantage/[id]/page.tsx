// app/(admin)/admin/advantage/[id]/page.tsx
import AdvantageForm from '@/app/admin/advantage/components/AdvantageForm';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const advantage = await db.travelAdvantage.findUnique({
        where: { id },
        select: {
            id: true,
            title: true,
        },
    });

    return {
        title: advantage
            ? `典藏優勢 - ${advantage.title}`
            : '典藏優勢 - Not Found',
    };
}

export default async function Page({ params }: Props) {
    const { id } = await params;

    const data = await db.travelAdvantage.findUnique({
        where: { id },
        select: {
            id: true,
            moduleId: true,
            imageUrl: true,
            title: true,
            content: true,
            order: true,
        },
    });

    if (!data) return notFound();

    const initialData = {
        id: data.id,
        moduleId: data.moduleId,
        imageUrl: data.imageUrl ?? '',
        title: data.title ?? '',
        content: data.content ?? '',
        order: data.order ?? 0,
    };

    return <AdvantageForm initialData={initialData} mode="edit" />;
}

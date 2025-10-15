
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import TravelConcernForm from '../components/TravelConcernForm';

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    return { title: `Concern - ${id}` };
}

export default async function Page({ params }: Props) {
    const { id } = await params;

    const data = await db.travelConcern.findUnique({
        where: { id },
        select: {
            id: true,
            moduleId: true,
            number: true,
            content: true,
            order: true,
        },
    });

    if (!data) return notFound();

    const initialData = {
        id: data.id,
        moduleId: data.moduleId,
        number: data.number ?? '',
        content: data.content ?? '',
        order: data.order ?? 0,
    };

    return <TravelConcernForm initialData={initialData} mode="edit" />;
}

import TestimonialForm from '@/app/admin/testimonial/components/TestimonialForm';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    return { title: `Testimonial - ${id}` };
}

export default async function Page({ params }: Props) {
    const { id } = await params;

    const data = await db.testimonial.findUnique({
        where: { id },
        select: {
            id: true,
            mode: true,
            nickname: true,
            stars: true,
            content: true,
            linkUrl: true,
            imageUrl: true,
            order: true,
        },
    });

    if (!data) return notFound();

    const initialData = {
        id: data.id,
        mode: data.mode,
        nickname: data.nickname ?? '',
        stars: data.stars ?? null,
        content: data.content ?? '',
        linkUrl: data.linkUrl ?? '',
        imageUrl: data.imageUrl ?? '',
        order: typeof data.order === 'number' ? data.order : 0,
    };

    return <TestimonialForm initialData={initialData} method="PUT" />;
}

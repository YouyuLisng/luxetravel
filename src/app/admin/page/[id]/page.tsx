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
    return { title: `Page - ${id}` };
}

export default async function Page({ params }: Props) {
    const { id } = await params;

    const data = await db.page.findUnique({
        where: { id },
        select: {
            id: true,
            title: true,
            slug: true,
            content: true,
            seoTitle: true,
            seoDesc: true,
            seoImage: true,
            keywords: true,
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
    };

    return <PageForm initialData={initialData} mode="edit" />;
}

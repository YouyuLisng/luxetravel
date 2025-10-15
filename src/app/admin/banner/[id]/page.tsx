// app/(admin)/admin/banner/[id]/page.tsx
import BannerForm from '@/app/admin/banner/components/BannerForm';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    return { title: `Banner - ${id}` };
}

export default async function Page({ params }: Props) {
    const { id } = await params;

    const data = await db.banner.findUnique({
        where: { id },
        select: {
            id: true,
            imageUrl: true,
            title: true,
            subtitle: true,
            linkText: true,
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
        linkText: data.linkText ?? '',
        linkUrl: data.linkUrl ?? '',
        order: data.order ?? 0,
    };

    return <BannerForm initialData={initialData} method="PUT" />;
}

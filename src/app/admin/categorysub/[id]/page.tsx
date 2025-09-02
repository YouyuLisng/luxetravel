import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import SubCategoryForm from '@/app/admin/categorysub/components/SubCategoryForm';

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    return { title: `子類別 - ${id}` };
}

export default async function Page({ params }: Props) {
    const { id } = await params;

    const data = await db.subCategory.findUnique({
        where: { id },
        select: {
            id: true,
            code: true,
            nameEn: true,
            nameZh: true,
            imageUrl: true,
            enabled: true,
            categoryId: true, // ✅ 多帶大類別 id
        },
    });

    if (!data) return notFound();

    const initialData = {
        id: data.id,
        code: data.code ?? '',
        nameEn: data.nameEn ?? '',
        nameZh: data.nameZh ?? '',
        imageUrl: data.imageUrl ?? undefined,
        enabled: data.enabled ?? true,
        categoryId: data.categoryId ?? '', // ✅ 傳給表單
    };

    return <SubCategoryForm initialData={initialData} method="PUT" />;
}

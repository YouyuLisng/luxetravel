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
        select: { id: true, title: true },
    });
    return { title: `經典卡片行程 - ${data?.title ?? ''}` };
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
            // ✅ 關聯多對多：帶出對應產品
            tourProducts: {
                select: {
                    tourProduct: {
                        select: {
                            id: true,
                            code: true,
                            name: true,
                            mainImageUrl: true,
                            priceMin: true,
                            priceMax: true,
                            status: true,
                        },
                    },
                },
            },
        },
    });

    if (!data) return notFound();

    // ✅ 轉換關聯資料格式
    const relatedProducts = data.tourProducts.map((tp) => ({
        id: tp.tourProduct.id,
        code: tp.tourProduct.code,
        name: tp.tourProduct.name,
    }));

    // ✅ 整理表單初始資料
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
        // ✅ 傳 string[] 給 react-hook-form schema 驗證
        tourProducts: relatedProducts.map((p) => p.id),
        // ✅ 額外傳詳細資料給畫面顯示 badge
        tourProductsDetail: relatedProducts,
    };

    return <CountryShowcaseForm initialData={initialData} method="PUT" />;
}

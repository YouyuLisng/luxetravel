'use server';

import { db } from '@/lib/db';

export type ProductProgress = {
    product: string;
    flight: string;
    itinerary: string;
    highlight: string;
    map: string;
    tours: string;
    percent: number; // 完成度百分比
};

export async function getProductProgress(
    productId: string
): Promise<ProductProgress | { error: string }> {
    if (!productId) return { error: '缺少 productId' };

    const product = await db.tourProduct.findUnique({
        where: { id: productId },
        include: {
            flights: true,
            itineraries: true,
            highlights: true,
            map: true, // ✅ 單數
            tour: true, // ✅ Tours[]
        },
    });

    if (!product) return { error: '找不到產品' };

    const productStatus = product.name ? '✅' : '⭕';
    const flightStatus = product.flights.length >= 2 ? '✅' : '⭕';
    const itineraryStatus =
        product.itineraries.length === product.days
            ? '✅'
            : product.itineraries.length > 0
              ? '⚠️'
              : '⭕';
    const highlightStatus = product.highlights.length > 0 ? '✅' : '⭕';
    const mapStatus = product.map ? '✅' : '⭕'; // ✅ 判斷單一物件
    const toursStatus = product.tour.length > 0 ? '✅' : '⭕';

    const statuses = [
        productStatus,
        flightStatus,
        itineraryStatus,
        highlightStatus,
        mapStatus,
        toursStatus,
    ];

    // ✅ = 2 分, ⚠️ = 1 分, ⭕ = 0 分
    const score = statuses.reduce((sum, s) => {
        if (s === '✅') return sum + 2;
        if (s === '⚠️') return sum + 1;
        return sum;
    }, 0);

    const stepCount = statuses.length;
    const percent = Math.round((score / (stepCount * 2)) * 100);

    return {
        product: productStatus,
        flight: flightStatus,
        itinerary: itineraryStatus,
        highlight: highlightStatus,
        map: mapStatus,
        tours: toursStatus,
        percent,
    };
}

/// 完成並上架
export async function publishProduct(productId: string) {
    if (!productId) return { error: '缺少 productId' };

    const product = await db.tourProduct.findUnique({
        where: { id: productId },
        include: {
            flights: true,
            itineraries: true,
            highlights: true,
            map: true, // ✅
            tour: true, // ✅
        },
    });

    if (!product) return { error: '找不到產品' };

    // 檢查完整性
    if (product.flights.length < 2) {
        return { error: '航班尚未完成設定' };
    }
    if (product.itineraries.length !== product.days) {
        return { error: '行程表不完整' };
    }
    if (!product.highlights.length || !product.map) {
        return { error: '亮點或地圖未設定' };
    }
    if (!product.tour.length) {
        return { error: '尚未新增團次' };
    }

    // 更新狀態為 PUBLISHED
    await db.tourProduct.update({
        where: { id: productId },
        data: { status: 1 }, // 1 = PUBLISHED
    });

    return { success: '產品已成功上架' };
}

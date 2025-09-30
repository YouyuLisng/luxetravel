import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

/** GET /api/products/countries - 回傳有上架產品的國家清單 (中文 + 英文 + 圖片) */
export async function GET() {
    try {
        // 1. 找出所有上架產品的 countries
        const products = await db.tourProduct.findMany({
            where: { status: 1 },
            select: { countries: true },
        });

        const allCodes = new Set<string>();
        products.forEach((p) => {
            p.countries?.forEach((c) => {
                if (c) allCodes.add(c);
            });
        });

        const codes = Array.from(allCodes);

        if (codes.length === 0) {
            return NextResponse.json({
                status: true,
                total: 0,
                data: [],
            });
        }

        // 2. 去 Country 表查對應資料
        const countries = await db.country.findMany({
            where: { code: { in: codes }, enabled: true },
            select: {
                code: true,
                nameZh: true,
                nameEn: true,
                imageUrl: true,
            },
            orderBy: { nameEn: 'asc' }, // 中文排序 (可以改成 nameEn)
        });

        return NextResponse.json({
            status: true,
            total: countries.length,
            data: countries,
        });
    } catch (err: any) {
        console.error('GET /api/product/countries error:', err);
        return NextResponse.json(
            { status: false, message: err?.message ?? '伺服器錯誤' },
            { status: 500 }
        );
    }
}

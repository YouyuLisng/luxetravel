import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);

    const destination = searchParams.get('destination');
    const budgetMin = searchParams.get('budgetMin');
    const budgetMax = searchParams.get('budgetMax');
    const daysRange = searchParams.get('daysRange');

    const page = Number(searchParams.get('page') ?? 1);
    const limit = Number(searchParams.get('limit') ?? 10);
    const skip = (page - 1) * limit;

    const sort = searchParams.get('sort') ?? 'createdAt';
    const order = searchParams.get('order') ?? 'desc';

    const where: any = { status: 1 };

    // 目的地 (支援多國家搜尋)
    if (destination) {
        const destinations = destination.split(',').map((d) => d.trim());
        where.arriveCountry = { in: destinations };
    }

    // 預算
    if (budgetMin || budgetMax) {
        where.AND = [
            budgetMin ? { priceMin: { gte: Number(budgetMin) } } : {},
            budgetMax ? { priceMin: { lte: Number(budgetMax) } } : {},
        ];
    }

    // 旅行天數
    if (daysRange && daysRange !== 'all') {
        const [min, max] = daysRange.split('-').map(Number);
        where.days = { gte: min, lte: max };
    }

    const [products, total] = await Promise.all([
        db.tourProduct.findMany({
            where,
            skip,
            take: limit,
            select: {
                id: true,
                code: true,
                namePrefix: true,
                name: true,
                mainImageUrl: true,
                summary: true,
                description: true,
                days: true,
                nights: true,
                departAirport: true,
                arriveCountry: true,
                arriveCity: true,
                arriveAirport: true,
                category: true,
                priceMin: true,
                priceMax: true,
                tags: true,
                countries: true,
                policy: true,
                status: true,
                categoryId: true,
                subCategoryId: true,
                createdAt: true,
                updatedAt: true,
                tour: {
                    include: {},
                    orderBy: { departDate: 'asc' },
                },
                flights: {
                    include: {},
                    orderBy: [{ day: 'asc' }, { departTime: 'asc' }],
                },
                highlights: {
                    include: {},
                    orderBy: { order: 'asc' },
                },
            },
            orderBy: {
                [sort]: order,
            },
        }),
        db.tourProduct.count({ where }),
    ]);

    // 收集所有代碼
    const allCodes = new Set<string>();
    products.forEach((p) => {
        p.countries?.forEach((c) => allCodes.add(c));
    });

    const countriesMap = await db.country.findMany({
        where: { code: { in: Array.from(allCodes) }, enabled: true },
        select: { code: true, nameZh: true, nameEn: true },
    });

    const countryDict = Object.fromEntries(
        countriesMap.map((c) => [c.code, { zh: c.nameZh, en: c.nameEn }])
    );

    // 替換 products 裡的 countries
    const formattedProducts = products.map((p) => ({
        ...p,
        countries: p.countries.map((code) => ({
            code,
            zh: countryDict[code]?.zh ?? code,
            en: countryDict[code]?.en ?? code,
        })),
    }));

    return NextResponse.json({
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        sort,
        order,
        data: formattedProducts,
    });
}

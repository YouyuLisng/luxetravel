import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);

    const destination = searchParams.get('destination');
    const budgetMin = searchParams.get('budgetMin');
    const budgetMax = searchParams.get('budgetMax');
    const daysRange = searchParams.get('daysRange');
    const category = searchParams.get('category');

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

    // ✅ 新增類別篩選
    if (category && category !== 'ALL') {
        where.category = category;
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
                isFeatured: true,
                feedback: {
                    select: {
                        id: true,
                        title: true,
                        nickname: true,
                        imageUrl: true,
                        linkUrl: true,
                    },
                },
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
            orderBy: [
                { isFeatured: 'desc' },
                { [sort]: order },
            ],
        }),
        db.tourProduct.count({ where }),
    ]);

    return NextResponse.json({
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        sort,
        order,
        data: products,
    });
}

import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);

    const destination = searchParams.get('destination');
    const budgetMin = searchParams.get('budgetMin');
    const budgetMax = searchParams.get('budgetMax');
    const daysRange = searchParams.get('daysRange');
    const category = searchParams.get('category');

    // 取得 page / limit，如果沒傳就是 undefined
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');

    const page = pageParam ? Number(pageParam) : undefined;
    const limit = limitParam ? Number(limitParam) : undefined;
    const skip = page && limit ? (page - 1) * limit : undefined;

    // ✅ 排序欄位與自動排序方向
    const sort = searchParams.get('sort') ?? 'createdAt';
    let order = (searchParams.get('order') as 'asc' | 'desc') ?? undefined;

    if (!order) {
        switch (sort) {
            case 'priceMin':
                order = 'asc'; // 價格由便宜到貴
                break;
            case 'priceMax':
                order = 'desc'; // 價格由貴到便宜
                break;
            case 'createdAt':
            default:
                order = 'desc'; // 最新在前
                break;
        }
    }

    const where: any = { status: 1 };

    // 目的地 (支援多國家搜尋)
    if (destination) {
        const destinations = destination.split(',').map((d) => d.trim());

        where.OR = [
            { arriveCountry: { in: destinations } },
            { countries: { hasSome: destinations } },
        ];
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

    // 類別篩選
    if (category && category !== 'ALL') {
        where.category = category;
    }

    // ✅ 排序：永遠先排精選，然後才是指定欄位
    const orderBy: any[] = [{ isFeatured: 'desc' }];
    if (sort) {
        orderBy.push({ [sort]: order });
    }

    try {
        // 如果有分頁參數 → 用 skip / take
        // 如果沒有分頁參數 → 回傳全部
        const [products, total] = await Promise.all([
            db.tourProduct.findMany({
                where,
                skip: skip,
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
                orderBy,
            }),
            db.tourProduct.count({ where }),
        ]);

        return NextResponse.json({
            page: page ?? null,
            limit: limit ?? null,
            total,
            totalPages: page && limit ? Math.ceil(total / limit) : 1,
            sort,
            order,
            data: products,
        });
    } catch (err) {
        console.error('GET /api/admin/product error:', err);
        return NextResponse.json(
            { status: false, message: '讀取失敗' },
            { status: 500 }
        );
    }
}

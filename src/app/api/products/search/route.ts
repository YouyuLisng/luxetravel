import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// ✅ 將 {{文字}} 包成有背景樣式的 <span>
function formatRichText(content?: string | null): string | null {
    if (!content) return null;

    let html = content.replace(/\{\{(.*?)\}\}/g, (_match, p1) => {
        const inner = p1.trim();
        return `<span style="background-color:#e6e2d9;color:#000;padding:0 2px;border-radius:2px;">${inner}</span>`;
    });

    // ✅ 換行符號改成 <br/>
    html = html.replace(/\r?\n/g, '<br/>');

    return html;
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);

    const destination = searchParams.get('destination');
    const budgetMin = searchParams.get('budgetMin');
    const budgetMax = searchParams.get('budgetMax');
    const daysRange = searchParams.get('daysRange');
    const category = searchParams.get('category');

    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    const page = pageParam ? Number(pageParam) : undefined;
    const limit = limitParam ? Number(limitParam) : undefined;
    const skip = page && limit ? (page - 1) * limit : undefined;

    const sort = searchParams.get('sort') ?? 'createdAt';
    const order = (searchParams.get('order') as 'asc' | 'desc') ?? 'desc';

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
                    reminder: true,
                    policy: true,
                    memo: true, // ✅ 新增
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
                    note: true,
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
                        orderBy: { departDate: 'asc' },
                    },
                    flights: {
                        orderBy: [{ day: 'asc' }, { departTime: 'asc' }],
                    },
                    highlights: {
                        orderBy: { order: 'asc' },
                    },
                },
                orderBy,
            }),
            db.tourProduct.count({ where }),
        ]);

        // ✅ 將 summary / description / reminder / policy / memo 轉為 HTML
        const formattedProducts = products.map((p) => ({
            ...p,
            summary: formatRichText(p.summary),
            description: formatRichText(p.description),
            reminder: formatRichText(p.reminder),
            policy: formatRichText(p.policy),
            memo: formatRichText(p.memo), // ✅ 新增處理
        }));

        return NextResponse.json({
            page: page ?? null,
            limit: limit ?? null,
            total,
            totalPages: page && limit ? Math.ceil(total / limit) : 1,
            sort,
            order,
            data: formattedProducts,
        });
    } catch (err) {
        console.error('GET /api/admin/product error:', err);
        return NextResponse.json(
            { status: false, message: '讀取失敗' },
            { status: 500 }
        );
    }
}

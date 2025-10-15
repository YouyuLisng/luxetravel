import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            bookImage,
            landscapeImage,
            title,
            subtitle,
            description,
            linkText,
            linkUrl,
            order,
        } = body;

        if (!bookImage || !title) {
            return NextResponse.json(
                { error: '缺少必要欄位（bookImage, title）' },
                { status: 400 }
            );
        }

        const item = await db.countryShowcase.create({
            data: {
                imageUrl: bookImage,
                imageUrl1: null,
                imageUrl2: landscapeImage || null,
                title,
                subtitle: subtitle || null,
                description: description || null,
                linkText: linkText || null,
                linkUrl: linkUrl || null,
                order: order ?? 0,
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: `Country Showcase「${item.title}」建立成功`,
                data: {
                    id: item.id,
                    bookImage: item.imageUrl,
                    landscapeImage: item.imageUrl2,
                    title: item.title,
                    subtitle: item.subtitle,
                    description: item.description,
                    linkText: item.linkText,
                    linkUrl: item.linkUrl,
                    order: item.order,
                    createdAt: item.createdAt,
                    updatedAt: item.updatedAt,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating country showcase:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

/* ---------------------- GET: 取得清單 ---------------------- */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const pageParam = searchParams.get('page');
        const pageSizeParam = searchParams.get('pageSize');

        // ✅ 查詢主資料 + 關聯完整 TourProduct
        const fetchData = async (skip?: number, take?: number): Promise<any[]> => {
            const data = await db.countryShowcase.findMany({
                orderBy: { order: 'asc' },
                skip,
                take,
                include: {
                    tourProducts: {
                        include: {
                            tourProduct: true, // ✅ 直接回傳完整欄位
                        },
                    },
                },
            });

            // ✅ 欄位重新命名
            return data.map((item) => ({
                ...item,
                bookImage: item.imageUrl,
                landscapeImage: item.imageUrl2,
                imageUrl: undefined,
                imageUrl1: undefined,
                imageUrl2: undefined,
            }));
        };

        // ✅ 分頁處理
        const page = Math.max(1, Number(pageParam ?? 1));
        const pageSize = Math.max(1, Math.min(100, Number(pageSizeParam ?? 0)));

        let total = 0;
        let rows: any[] = [];

        if (!pageParam && !pageSizeParam) {
            rows = await fetchData();
            total = rows.length;
        } else {
            [total, rows] = await Promise.all([
                db.countryShowcase.count(),
                fetchData((page - 1) * pageSize, pageSize),
            ]);
        }

        // ✅ 依 category 分類產品
        const formatted = rows.map((item) => {
            const groupProducts: any[] = [];
            const freeProducts: any[] = [];
            const recoProducts: any[] = [];

            for (const tp of item.tourProducts ?? []) {
                const p = tp.tourProduct;
                if (!p) continue;
                if (p.category === 'GROUP') groupProducts.push(p);
                else if (p.category === 'FREE') freeProducts.push(p);
                else if (p.category === 'RECO') recoProducts.push(p);
            }

            return {
                id: item.id,
                bookImage: item.bookImage,
                landscapeImage: item.landscapeImage,
                title: item.title,
                subtitle: item.subtitle,
                description: item.description,
                linkText: item.linkText,
                linkUrl: item.linkUrl,
                order: item.order,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
                groupProducts,
                freeProducts,
                recoProducts,
            };
        });

        // ✅ pagination 統一格式
        const pagination = {
            page,
            pageSize: pageSize || total || 1,
            total,
            pageCount: Math.max(1, Math.ceil(total / (pageSize || total || 1))),
        };

        return NextResponse.json(
            {
                status: true,
                message: '成功取得 CountryShowcase 清單（含完整關聯產品）',
                rows: formatted,
                pagination,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error fetching showcases:', error);
        return NextResponse.json(
            { status: false, message: 'Failed to fetch country showcases' },
            { status: 500 }
        );
    }
}

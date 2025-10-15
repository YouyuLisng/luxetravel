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

        // ✅ 驗證欄位
        if (!bookImage || !title) {
            return NextResponse.json(
                { error: '缺少必要欄位（bookImage, title）' },
                { status: 400 }
            );
        }

        // ✅ 寫入資料庫時對應原欄位名稱
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

        // ✅ 回傳時轉換命名
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

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const pageParam = searchParams.get('page');
        const pageSizeParam = searchParams.get('pageSize');

        // ✅ 查詢主資料 + 關聯產品
        const fetchData = async (skip?: number, take?: number): Promise<any[]> => {
            const data = await db.countryShowcase.findMany({
                orderBy: { order: 'asc' },
                skip,
                take,
                include: {
                    tourProducts: {
                        include: {
                            tourProduct: {
                                select: {
                                    id: true,
                                    mainImageUrl: true,
                                    code: true,
                                    namePrefix: true,
                                    name: true,
                                    summary: true,
                                    tags: true,
                                    countries: true,
                                    category: true,
                                    arriveCountry: true,
                                    days: true,
                                    nights: true,
                                    priceMin: true,
                                    priceMax: true,
                                    status: true,
                                },
                            },
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

        // ✅ 處理分頁邏輯
        const page = Math.max(1, Number(pageParam ?? 1));
        const pageSize = Math.max(
            1,
            Math.min(100, Number(pageSizeParam ?? 0))
        );

        let total = 0;
        let rows: any[] = [];

        if (!pageParam && !pageSizeParam) {
            // 👉 沒有分頁參數：抓全部
            rows = await fetchData();
            total = rows.length;
        } else {
            // 👉 有分頁參數：分頁查詢
            [total, rows] = await Promise.all([
                db.countryShowcase.count(),
                fetchData((page - 1) * pageSize, pageSize),
            ]);
        }

        // ✅ 分類產品
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

        // ✅ 統一 pagination 結構（即使無分頁也有）
        const pagination = {
            page,
            pageSize: pageSize || total || 1, // 若沒帶 pageSize 就用全部筆數
            total,
            pageCount: Math.max(1, Math.ceil(total / (pageSize || total || 1))),
        };

        return NextResponse.json(
            {
                status: true,
                message: '成功取得 CountryShowcase 清單（含關聯產品）',
                rows: formatted,
                pagination, // ✅ 不會是 null
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

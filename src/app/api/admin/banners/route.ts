import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ➤ 輔助：標題/副標題切分
function formatTitle(title: string) {
    const chars = Array.from(title);
    return [chars.slice(0, 5).join(''), chars.slice(5).join('')];
}

function formatSubtitle(subtitle: string) {
    const chars = Array.from(subtitle);
    return [chars.slice(0, 12).join(''), chars.slice(12).join('')];
}

// ➤ 建立 Banner
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { imageUrl, title, subtitle, linkText, linkUrl, order } = body;

        if (!imageUrl) {
            return NextResponse.json(
                { status: false, message: '缺少 imageUrl' },
                { status: 400 }
            );
        }

        if (!title) {
            return NextResponse.json(
                { status: false, message: '缺少 title' },
                { status: 400 }
            );
        }

        const banner = await db.banner.create({
            data: {
                imageUrl,
                title,
                subtitle,
                linkText,
                linkUrl,
                order: typeof order === 'number' ? order : 0,
            },
        });

        return NextResponse.json(
            {
                status: true,
                message: `Banner「${banner.title || banner.id}」建立成功`,
                data: banner,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating banner:', error);
        return NextResponse.json(
            { status: false, message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

// ➤ 取得 Banner 列表
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const pageParam = searchParams.get('page');
        const pageSizeParam = searchParams.get('pageSize');

        // 如果沒帶 page/pageSize → 回傳全部
        if (!pageParam && !pageSizeParam) {
            const rows = await db.banner.findMany({
                orderBy: { order: 'asc' },
            });

            const formattedRows = rows.map((banner) => {
                const [titleLine1, titleLine2] = formatTitle(banner.title);
                const [subtitleLine1, subtitleLine2] = banner.subtitle
                    ? formatSubtitle(banner.subtitle)
                    : ['', ''];

                return {
                    ...banner,
                    titleLine1,
                    titleLine2,
                    subtitleLine1,
                    subtitleLine2,
                };
            });

            return NextResponse.json(
                {
                    status: true,
                    message: '成功取得全部 Banner 清單',
                    rows: formattedRows,
                    pagination: null, // 沒有分頁
                },
                { status: 200 }
            );
        }

        // 有帶分頁參數 → 分頁查詢
        const page = Math.max(1, Number(pageParam ?? 1));
        const pageSize = Math.max(
            1,
            Math.min(100, Number(pageSizeParam ?? 10))
        );

        const [total, rows] = await Promise.all([
            db.banner.count(),
            db.banner.findMany({
                orderBy: { order: 'asc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
        ]);

        const formattedRows = rows.map((banner) => {
            const [titleLine1, titleLine2] = formatTitle(banner.title);
            const [subtitleLine1, subtitleLine2] = banner.subtitle
                ? formatSubtitle(banner.subtitle)
                : ['', ''];

            return {
                ...banner,
                titleLine1,
                titleLine2,
                subtitleLine1,
                subtitleLine2,
            };
        });

        return NextResponse.json(
            {
                status: true,
                message: '成功取得 Banner 分頁清單',
                rows: formattedRows,
                pagination: {
                    page,
                    pageSize,
                    total,
                    pageCount: Math.max(1, Math.ceil(total / pageSize)),
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error fetching banners:', error);
        return NextResponse.json(
            { status: false, message: 'Failed to fetch banners' },
            { status: 500 }
        );
    }
}

import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/admin/articles
 * 支援 query: ?page=&pageSize=&q=
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const pageParam = searchParams.get('page');
        const pageSizeParam = searchParams.get('pageSize');
        const q = searchParams.get('q');

        const where: any = {};
        if (q) {
            where.OR = [
                { title: { contains: q, mode: 'insensitive' } },
                { subtitle: { contains: q, mode: 'insensitive' } },
            ];
        }

        // ➤ 如果沒有帶 page & pageSize，回傳全部
        if (!pageParam && !pageSizeParam) {
            const rows = await db.article.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                include: {
                    countries: { include: { country: true } },
                },
            });

            const data = rows.map((row) => ({
                id: row.id,
                title: row.title,
                subtitle: row.subtitle,
                linkUrl: (row as any).linkUrl, // 如果有 linkUrl 欄位
                imageUrl: row.imageUrl,
                createdAt: row.createdAt,
                updatedAt: row.updatedAt,
                countries: row.countries.map((ac) => ({
                    id: ac.country.id,
                    name: ac.country.name,
                    nameZh: ac.country.nameZh,
                    code: ac.country.code,
                    createdAt: ac.country.createdAt,
                    updatedAt: ac.country.updatedAt,
                })),
            }));

            return NextResponse.json({
                status: true,
                message: '成功取得全部 Article 清單',
                rows: data,
                pagination: null, // 沒有分頁
            });
        }

        // ➤ 有帶分頁參數 → 分頁處理
        const page = Math.max(1, Number(pageParam ?? 1));
        const pageSize = Math.max(
            1,
            Math.min(100, Number(pageSizeParam ?? 10))
        );

        const [total, rows] = await Promise.all([
            db.article.count({ where }),
            db.article.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                include: {
                    countries: { include: { country: true } },
                },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
        ]);

        const data = rows.map((row) => ({
            id: row.id,
            title: row.title,
            subtitle: row.subtitle,
            linkUrl: (row as any).linkUrl,
            imageUrl: row.imageUrl,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            countries: row.countries.map((ac) => ({
                id: ac.country.id,
                name: ac.country.name,
                nameZh: ac.country.nameZh,
                code: ac.country.code,
                createdAt: ac.country.createdAt,
                updatedAt: ac.country.updatedAt,
            })),
        }));

        return NextResponse.json({
            status: true,
            message: '成功取得 Article 分頁清單',
            rows: data,
            pagination: {
                page,
                pageSize,
                total,
                pageCount: Math.max(1, Math.ceil(total / pageSize)),
            },
        });
    } catch (error) {
        console.error('Failed to list articles with countries:', error);
        return NextResponse.json(
            { status: false, error: 'Failed to list articles with countries' },
            { status: 500 }
        );
    }
}

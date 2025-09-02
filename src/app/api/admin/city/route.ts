import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { CityCreateSchema } from '@/schemas/city';

/**
 * GET /api/admin/city?page=&pageSize=&q=
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const page = Math.max(1, Number(searchParams.get('page') ?? 1));
        const pageSize = Math.max(
            1,
            Math.min(100, Number(searchParams.get('pageSize') ?? 10))
        );
        const q = searchParams.get('q')?.trim();

        const where: any = {};
        if (q) {
            where.OR = [
                { code: { contains: q, mode: 'insensitive' } },
                { nameZh: { contains: q, mode: 'insensitive' } },
                { nameEn: { contains: q, mode: 'insensitive' } },
                { country: { contains: q, mode: 'insensitive' } },
            ];
        }

        const [total, rows] = await Promise.all([
            db.city.count({ where }),
            db.city.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
        ]);

        return NextResponse.json(
            {
                rows,
                pagination: {
                    page,
                    pageSize,
                    total,
                    pageCount: Math.max(1, Math.ceil(total / pageSize)),
                },
            },
            { status: 200 }
        );
    } catch (err) {
        console.error('Error fetching cities:', err);
        return NextResponse.json({ error: '讀取失敗' }, { status: 500 });
    }
}

/**
 * POST /api/admin/city - 新增 City
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = CityCreateSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: '欄位格式錯誤', issues: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const { code, nameZh, nameEn, country, imageUrl, enabled } =
            parsed.data;
        const upper = code.toUpperCase();

        // 檢查唯一
        const dup = await db.city.findUnique({ where: { code: upper } });
        if (dup) {
            return NextResponse.json(
                { error: `代碼已存在：${upper}` },
                { status: 409 }
            );
        }

        const data = await db.city.create({
            data: {
                code: upper,
                nameZh: nameZh.trim(),
                nameEn: nameEn.trim(),
                country: country.trim(),
                imageUrl: imageUrl === null ? null : imageUrl?.trim(),
                enabled: enabled ?? true,
            },
        });

        return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (err) {
        console.error('Error creating city:', err);
        return NextResponse.json({ error: '建立失敗' }, { status: 500 });
    }
}

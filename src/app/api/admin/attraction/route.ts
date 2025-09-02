import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
    AttractionCreateSchema,
    type AttractionCreateValues,
} from '@/schemas/attraction';

/** GET /api/admin/attraction?page=&pageSize=&q= */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const page = Math.max(1, Number(searchParams.get('page') ?? 1));
        const pageSize = Math.max(
            1,
            Math.min(100, Number(searchParams.get('pageSize') ?? 10))
        );
        const q = searchParams.get('q');

        const where: any = {};
        if (q) {
            where.OR = [
                { name: { contains: q, mode: 'insensitive' } },
                { code: { contains: q, mode: 'insensitive' } },
            ];
        }

        const [total, rows] = await Promise.all([
            db.attraction.count({ where }),
            db.attraction.findMany({
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
        console.error('Error fetching attractions:', err);
        return NextResponse.json({ error: '讀取失敗' }, { status: 500 });
    }
}

/** POST /api/admin/attraction - 新增 Attraction */
export async function POST(req: Request) {
    try {
        const json = (await req.json()) as AttractionCreateValues;
        const parsed = AttractionCreateSchema.safeParse(json);
        if (!parsed.success) {
            return NextResponse.json(
                { error: '欄位格式錯誤', issues: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const data = parsed.data;

        // code 唯一性檢查
        if (data.code) {
            const up = data.code.toUpperCase();
            const dup = await db.attraction.findUnique({ where: { code: up } });
            if (dup) {
                return NextResponse.json(
                    { error: `代碼已存在：${up}` },
                    { status: 409 }
                );
            }
            data.code = up;
        }

        const created = await db.attraction.create({ data });
        return NextResponse.json(
            { success: true, data: created },
            { status: 201 }
        );
    } catch (err) {
        console.error('Error creating attraction:', err);
        return NextResponse.json({ error: '建立失敗' }, { status: 500 });
    }
}

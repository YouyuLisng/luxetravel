import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import {
    LexiconCreateSchema,
    type LexiconCreateValues,
} from '@/schemas/lexicon';

/** GET /api/admin/lexicon?page=&pageSize=&type= */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type') || undefined;
        const page = Math.max(1, Number(searchParams.get('page') ?? 1));
        const pageSize = Math.max(
            1,
            Math.min(100, Number(searchParams.get('pageSize') ?? 10))
        );

        const where = type ? { type } : {};

        const [total, rows] = await Promise.all([
            db.lexicon.count({ where }),
            db.lexicon.findMany({
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
        console.error('GET /lexicon error:', err);
        return NextResponse.json({ error: '讀取失敗' }, { status: 500 });
    }
}

/** POST /api/admin/lexicon - 新增 */
export async function POST(req: Request) {
    try {
        const body = (await req.json()) as LexiconCreateValues;
        const parsed = LexiconCreateSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: '欄位格式錯誤' },
                { status: 400 }
            );
        }

        const { title, type, context } = parsed.data;

        // 檢查同 type 下的唯一性
        const dup = await db.lexicon.findFirst({
            where: { type, title },
        });
        if (dup) {
            return NextResponse.json(
                { error: `此類型下已存在同名辭庫：${title}` },
                { status: 400 }
            );
        }

        const data = await db.lexicon.create({
            data: {
                title: title.trim(),
                type: type.trim(),
                context: context.trim(),
            },
        });

        return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (err) {
        console.error('POST /lexicon error:', err);
        return NextResponse.json({ error: '新增失敗' }, { status: 500 });
    }
}

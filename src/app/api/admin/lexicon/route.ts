import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db';
import {
    LexiconCreateSchema,
    type LexiconCreateValues,
} from '@/schemas/lexicon';

/** GET /api/admin/lexicon - 取得全部辭庫 (可帶參數篩選) */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type') || undefined;

        const data = await db.lexicon.findMany({
            where: type ? { type } : undefined,
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ status: true, data });
    } catch (err) {
        return NextResponse.json(
            { status: false, message: '讀取失敗' },
            { status: 500 }
        );
    }
}
/** POST /api/admin/lexicon - 新增 */
export async function POST(req: Request) {
    try {
        const body = (await req.json()) as LexiconCreateValues;
        const parsed = LexiconCreateSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { status: false, message: '欄位格式錯誤' },
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
                { status: false, message: `此類型下已存在同名辭庫：${title}` },
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

        return NextResponse.json({ status: true, data });
    } catch (err) {
        return NextResponse.json(
            { status: false, message: '新增失敗' },
            { status: 500 }
        );
    }
}

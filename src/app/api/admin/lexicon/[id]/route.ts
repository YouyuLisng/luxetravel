import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { LexiconEditSchema, type LexiconEditValues } from '@/schemas/lexicon';

interface Props {
    params: Promise<{ id: string }>;
}

/** GET /api/admin/lexicon/[id] - 取得單筆 */
export async function GET(_request: NextRequest, { params }: Props) {
    const { id } = await params;
    try {
        const data = await db.lexicon.findUnique({
            where: { id },
        });
        if (!data) {
            return NextResponse.json(
                { status: false, message: '找不到 Lexicon' },
                { status: 404 }
            );
        }
        return NextResponse.json({ status: true, data });
    } catch {
        return NextResponse.json(
            { status: false, message: '讀取失敗' },
            { status: 500 }
        );
    }
}

/** PATCH /api/admin/lexicon/[id] - 編輯 */
export async function PATCH(req: NextRequest, { params }: Props) {
    const { id } = await params;
    try {
        const body = await req.json();
        const parsed = LexiconEditSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { status: false, message: '欄位格式錯誤' },
                { status: 400 }
            );
        }

        const exists = await db.lexicon.findUnique({ where: { id } });
        if (!exists) {
            return NextResponse.json(
                { status: false, message: '找不到 Lexicon' },
                { status: 404 }
            );
        }

        const { title, type, context } = parsed.data;
        const patch: Partial<LexiconEditValues> = {};
        if (title !== undefined) patch.title = title.trim();
        if (type !== undefined) patch.type = type.trim();
        if (context !== undefined) patch.context = context.trim();

        const data = await db.lexicon.update({
            where: { id },
            data: patch,
        });

        return NextResponse.json({ status: true, data });
    } catch {
        return NextResponse.json(
            { status: false, message: '更新失敗' },
            { status: 500 }
        );
    }
}

/** DELETE /api/admin/lexicon/[id] - 刪除 */
export async function DELETE(_req: NextRequest, { params }: Props) {
    const { id } = await params;
    try {
        const exists = await db.lexicon.findUnique({ where: { id } });
        if (!exists) {
            return NextResponse.json(
                { status: false, message: '找不到 Lexicon' },
                { status: 404 }
            );
        }

        await db.lexicon.delete({ where: { id } });
        return NextResponse.json({ status: true, message: '刪除成功' });
    } catch {
        return NextResponse.json(
            { status: false, message: '刪除失敗' },
            { status: 500 }
        );
    }
}

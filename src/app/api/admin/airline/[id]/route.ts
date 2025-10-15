import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { AirlineEditSchema, type AirlineEditValues } from '@/schemas/airline';

interface Props {
    params: Promise<{ id: string }>;
}

/** GET /api/admin/airline/[id] - 取得單筆 */
export async function GET(_request: NextRequest, { params }: Props) {
    const { id } = await params;
    try {
        const data = await db.airline.findUnique({ where: { id } });
        if (!data) {
            return NextResponse.json(
                { error: '找不到 Airline' },
                { status: 404 }
            );
        }
        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: '讀取失敗' }, { status: 500 });
    }
}

/** PATCH /api/admin/airline/[id] - 編輯 */
export async function PUT(req: Request, { params }: Props) {
    const { id } = await params;
    try {
        if (!id)
            return NextResponse.json({ error: '無效的 ID' }, { status: 400 });

        const exists = await db.airline.findUnique({ where: { id } });
        if (!exists) {
            return NextResponse.json(
                { error: '找不到 Airline' },
                { status: 404 }
            );
        }

        const json = (await req.json()) as AirlineEditValues;
        const parsed = AirlineEditSchema.safeParse(json);
        if (!parsed.success) {
            return NextResponse.json(
                { error: '欄位格式錯誤' },
                { status: 400 }
            );
        }

        const { code, nameZh, nameEn, imageUrl, enabled } = parsed.data;

        // 若更新代碼，做唯一檢查
        if (code !== undefined) {
            const up = code.toUpperCase();
            if (up !== exists.code) {
                const dup = await db.airline.findUnique({
                    where: { code: up },
                });
                if (dup) {
                    return NextResponse.json(
                        { error: `代碼已存在：${up}` },
                        { status: 409 }
                    );
                }
            }
        }

        const patch: {
            code?: string;
            nameZh?: string;
            nameEn?: string;
            imageUrl?: string | null;
            enabled?: boolean;
        } = {};

        if (code !== undefined) patch.code = code.toUpperCase();
        if (nameZh !== undefined) patch.nameZh = nameZh.trim();
        if (nameEn !== undefined) patch.nameEn = nameEn.trim();
        if (imageUrl !== undefined)
            patch.imageUrl = imageUrl === null ? null : imageUrl.trim();
        if (enabled !== undefined) patch.enabled = enabled;

        const data = await db.airline.update({ where: { id }, data: patch });
        return NextResponse.json({ success: '更新成功', data });
    } catch {
        return NextResponse.json({ error: '更新失敗' }, { status: 500 });
    }
}

/** DELETE /api/admin/airline/[id] - 刪除 */
export async function DELETE(_req: Request, { params }: Props) {
    const { id } = await params;
    try {
        if (!id)
            return NextResponse.json({ error: '無效的 ID' }, { status: 400 });

        const exists = await db.airline.findUnique({ where: { id } });
        if (!exists) {
            return NextResponse.json(
                { error: '找不到 Airline' },
                { status: 404 }
            );
        }

        const data = await db.airline.delete({ where: { id } });
        return NextResponse.json({ success: '刪除成功', data });
    } catch {
        return NextResponse.json({ error: '刪除失敗' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
    AttractionEditSchema,
    type AttractionEditValues,
} from '@/schemas/attraction';

interface Props {
    params: Promise<{ id: string }>;
}

/** GET /api/admin/attraction/[id] - 取得單筆 */
export async function GET(_req: Request, { params }: Props) {
    const { id } = await params;
    try {
        const data = await db.attraction.findUnique({ where: { id } });
        if (!data) {
            return NextResponse.json(
                { status: false, message: '找不到 Attraction' },
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

/** PATCH /api/admin/attraction/[id] - 編輯 */
export async function PUT(req: Request, { params }: Props) {
    const { id } = await params;
    try {
        if (!id) {
            return NextResponse.json(
                { status: false, message: '無效的 ID' },
                { status: 400 }
            );
        }

        const exists = await db.attraction.findUnique({ where: { id } });
        if (!exists) {
            return NextResponse.json(
                { status: false, message: '找不到 Attraction' },
                { status: 404 }
            );
        }

        const json = (await req.json()) as AttractionEditValues;
        const parsed = AttractionEditSchema.safeParse(json);
        if (!parsed.success) {
            return NextResponse.json(
                { status: false, message: '欄位格式錯誤' },
                { status: 400 }
            );
        }

        const data = parsed.data;

        // code 唯一性檢查
        if (data.code !== undefined && data.code !== null) {
            const up = data.code.toUpperCase();
            if (up !== exists.code) {
                const dup = await db.attraction.findUnique({
                    where: { code: up },
                });
                if (dup) {
                    return NextResponse.json(
                        { status: false, message: `代碼已存在：${up}` },
                        { status: 409 }
                    );
                }
            }
            data.code = up;
        }

        const updated = await db.attraction.update({ where: { id }, data });
        return NextResponse.json({ status: true, data: updated });
    } catch {
        return NextResponse.json(
            { status: false, message: '更新失敗' },
            { status: 500 }
        );
    }
}

/** DELETE /api/admin/attraction/[id] - 刪除 */
export async function DELETE(_req: Request, { params }: Props) {
    const { id } = await params;
    try {
        if (!id) {
            return NextResponse.json(
                { status: false, message: '無效的 ID' },
                { status: 400 }
            );
        }

        const exists = await db.attraction.findUnique({ where: { id } });
        if (!exists) {
            return NextResponse.json(
                { status: false, message: '找不到 Attraction' },
                { status: 404 }
            );
        }

        const deleted = await db.attraction.delete({ where: { id } });
        return NextResponse.json({ status: true, data: deleted });
    } catch {
        return NextResponse.json(
            { status: false, message: '刪除失敗' },
            { status: 500 }
        );
    }
}

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
    AttractionCreateSchema,
    type AttractionCreateValues,
} from '@/schemas/attraction';

/** GET /api/admin/attraction - 取得全部 Attraction */
export async function GET() {
    try {
        const data = await db.attraction.findMany({
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

/** POST /api/admin/attraction - 新增 Attraction */
export async function POST(req: Request) {
    try {
        const json = (await req.json()) as AttractionCreateValues;
        const parsed = AttractionCreateSchema.safeParse(json);
        if (!parsed.success) {
            return NextResponse.json(
                { status: false, message: '欄位格式錯誤' },
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
                    { status: false, message: `代碼已存在：${up}` },
                    { status: 409 }
                );
            }
            data.code = up;
        }

        const created = await db.attraction.create({ data });
        return NextResponse.json(
            { status: true, data: created },
            { status: 201 }
        );
    } catch (err) {
        return NextResponse.json(
            { status: false, message: '建立失敗' },
            { status: 500 }
        );
    }
}

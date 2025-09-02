import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { CityEditSchema } from '@/schemas/city';

interface Props {
    params: Promise<{ id: string }>;
}

/** GET /api/admin/city/[id] - 取得單筆 City */
export async function GET(_req: Request, { params }: Props) {
    try {
        const { id } = await params;
        const data = await db.city.findUnique({ where: { id } });
        if (!data)
            return NextResponse.json(
                { status: false, message: '找不到 City' },
                { status: 404 }
            );

        return NextResponse.json({ status: true, data });
    } catch (err) {
        return NextResponse.json(
            { status: false, message: '讀取失敗' },
            { status: 500 }
        );
    }
}

/** PATCH /api/admin/city/[id] - 編輯 City */
export async function PATCH(req: Request, { params }: Props) {
    try {
        const { id } = await params;
        if (!id)
            return NextResponse.json(
                { status: false, message: '無效的 ID' },
                { status: 400 }
            );

        const body = await req.json();
        const parsed = CityEditSchema.safeParse(body);
        if (!parsed.success)
            return NextResponse.json(
                { status: false, message: '欄位格式錯誤' },
                { status: 400 }
            );

        const exists = await db.city.findUnique({ where: { id } });
        if (!exists)
            return NextResponse.json(
                { status: false, message: '找不到 City' },
                { status: 404 }
            );

        const { code, nameZh, nameEn, country, imageUrl, enabled } =
            parsed.data;

        // 如果更新代碼 → 檢查唯一
        if (code !== undefined) {
            const up = code.toUpperCase();
            if (up !== exists.code) {
                const dup = await db.city.findUnique({ where: { code: up } });
                if (dup)
                    return NextResponse.json(
                        { status: false, message: `代碼已存在：${up}` },
                        { status: 400 }
                    );
            }
        }

        const patch: {
            code?: string;
            nameZh?: string;
            nameEn?: string;
            country?: string;
            imageUrl?: string | null;
            enabled?: boolean;
        } = {};

        if (code !== undefined) patch.code = code.toUpperCase();
        if (nameZh !== undefined) patch.nameZh = nameZh.trim();
        if (nameEn !== undefined) patch.nameEn = nameEn.trim();
        if (country !== undefined) patch.country = country.trim();
        if (imageUrl !== undefined)
            patch.imageUrl = imageUrl === null ? null : imageUrl.trim();
        if (enabled !== undefined) patch.enabled = enabled;

        const data = await db.city.update({ where: { id }, data: patch });
        return NextResponse.json({ status: true, data });
    } catch (err) {
        return NextResponse.json(
            { status: false, message: '更新失敗' },
            { status: 500 }
        );
    }
}

/** DELETE /api/admin/city/[id] - 刪除 City */
export async function DELETE(_req: Request, { params }: Props) {
    try {
        const { id } = await params;
        if (!id)
            return NextResponse.json(
                { status: false, message: '無效的 ID' },
                { status: 400 }
            );

        const exists = await db.city.findUnique({ where: { id } });
        if (!exists)
            return NextResponse.json(
                { status: false, message: '找不到 City' },
                { status: 404 }
            );

        const data = await db.city.delete({ where: { id } });
        return NextResponse.json({ status: true, data });
    } catch (err) {
        return NextResponse.json(
            { status: false, message: '刪除失敗' },
            { status: 500 }
        );
    }
}

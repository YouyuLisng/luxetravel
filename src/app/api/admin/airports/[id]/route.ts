// app/api/admin/airports/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

interface Props {
    params: Promise<{ id: string }>;
}

const isObjectId = (s: string) => /^[a-fA-F0-9]{24}$/.test(s);

// Update 用 schema（欄位皆可選）
const UpdateSchema = z.object({
    code: z.string().trim().min(1).optional(),
    nameZh: z.string().trim().min(1).optional(),
    nameEn: z.string().trim().min(1).optional(),
    imageUrl: z.string().trim().url().optional().nullable(),
    enabled: z.boolean().optional(),
    regionId: z.string().trim().min(1).optional(),
    countryId: z.string().trim().min(1).optional(),
});

// 讀取單筆
export async function GET(_req: NextRequest, { params }: Props) {
    const { id } = await params;
    if (!id || !isObjectId(id)) {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    try {
        const row = await db.airport.findUnique({
            where: { id },
            include: { region: true, country: true },
        });

        if (!row) {
            return NextResponse.json(
                { status: false, message: '找不到機場' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            status: true,
            message: `已取得機場「${row.nameZh}（${row.code}）」`,
            data: row,
        });
    } catch (e) {
        console.error('GET /airports/[id] error:', e);
        return NextResponse.json({ error: '查詢機場失敗' }, { status: 500 });
    }
}

// 更新
export async function PUT(req: NextRequest, { params }: Props) {
    const { id } = await params;
    if (!id || !isObjectId(id)) {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    try {
        const json = await req.json();
        const parsed = UpdateSchema.safeParse(json);
        if (!parsed.success) {
            const msg = parsed.error.issues[0]?.message ?? '資料驗證失敗';
            return NextResponse.json({ error: msg }, { status: 400 });
        }

        const existing = await db.airport.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: '找不到機場' }, { status: 404 });
        }

        const { code, nameZh, nameEn, imageUrl, enabled, regionId, countryId } =
            parsed.data;

        // 若要更新 regionId / countryId，先檢查格式與存在性
        if (regionId !== undefined) {
            if (!isObjectId(regionId)) {
                return NextResponse.json(
                    { error: 'regionId 格式錯誤' },
                    { status: 400 }
                );
            }
            const region = await db.region.findUnique({
                where: { id: regionId },
            });
            if (!region)
                return NextResponse.json(
                    { error: '找不到對應的地區' },
                    { status: 404 }
                );
        }
        if (countryId !== undefined) {
            if (!isObjectId(countryId)) {
                return NextResponse.json(
                    { error: 'countryId 格式錯誤' },
                    { status: 400 }
                );
            }
            const country = await db.country.findUnique({
                where: { id: countryId },
            });
            if (!country)
                return NextResponse.json(
                    { error: '找不到對應的國家' },
                    { status: 404 }
                );
        }

        // 若要更新 code，檢查唯一
        if (code && code.toUpperCase() !== existing.code) {
            const dup = await db.airport.findUnique({
                where: { code: code.toUpperCase() },
            });
            if (dup) {
                return NextResponse.json(
                    { error: `機場代碼已存在：${code.toUpperCase()}` },
                    { status: 409 }
                );
            }
        }

        const data: Prisma.AirportUpdateInput = {};
        if (code !== undefined) data.code = code.toUpperCase();
        if (nameZh !== undefined) data.nameZh = nameZh.trim();
        if (nameEn !== undefined) data.nameEn = nameEn.trim();
        if (imageUrl !== undefined)
            data.imageUrl = imageUrl === null ? null : imageUrl.trim();
        if (enabled !== undefined) data.enabled = enabled;
        if (regionId !== undefined) data.region = { connect: { id: regionId } };
        if (countryId !== undefined)
            data.country = { connect: { id: countryId } };

        const updated = await db.airport.update({
            where: { id },
            data,
            include: { region: true, country: true },
        });

        return NextResponse.json({
            status: true,
            message: `已更新機場「${updated.nameZh}（${updated.code}）」`,
            data: updated,
        });
    } catch (e) {
        console.error('PUT /airports/[id] error:', e);
        return NextResponse.json({ error: '更新機場失敗' }, { status: 500 });
    }
}

// 刪除
export async function DELETE(_req: NextRequest, { params }: Props) {
    const { id } = await params;
    if (!id || !isObjectId(id)) {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    try {
        const deleted = await db.airport.delete({ where: { id } });
        return NextResponse.json({
            status: true,
            message: `已刪除機場「${deleted.nameZh}（${deleted.code}）」`,
            data: deleted,
        });
    } catch (e) {
        console.error('DELETE /airports/[id] error:', e);
        return NextResponse.json({ error: '刪除機場失敗' }, { status: 500 });
    }
}

// src/app/api/admin/regions/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

interface Props {
    params: Promise<{ id: string }>;
}

const UpdateSchema = z.object({
    code: z.string().trim().min(1).optional(),
    nameEn: z.string().trim().min(1).optional(),
    nameZh: z.string().trim().min(1).optional(),
    imageUrl: z.string().trim().url().optional().nullable(),
    enabled: z.boolean().optional(),
});

export async function GET(_req: NextRequest, { params }: Props) {
    const { id } = await params;
    if (!id || typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    try {
        const row = await db.region.findUnique({ where: { id } });
        if (!row) {
            return NextResponse.json(
                { status: false, message: '找不到地區' },
                { status: 404 }
            );
        }
        return NextResponse.json({ status: true, data: row });
    } catch (e) {
        console.error('GET /regions/[id] error:', e);
        return NextResponse.json({ error: '查詢失敗' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: Props) {
    const { id } = await params;
    if (!id || typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    try {
        const json = await req.json();
        const parsed = UpdateSchema.safeParse(json);
        if (!parsed.success) {
            const msg = parsed.error.issues[0]?.message ?? '資料驗證失敗';
            return NextResponse.json({ error: msg }, { status: 400 });
        }

        const existing = await db.region.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: '找不到地區' }, { status: 404 });
        }

        const { code, nameEn, nameZh, imageUrl, enabled } = parsed.data;

        if (code && code.toUpperCase() !== existing.code) {
            const dup = await db.region.findUnique({
                where: { code: code.toUpperCase() },
            });
            if (dup) {
                return NextResponse.json(
                    { error: `代碼已存在：${code.toUpperCase()}` },
                    { status: 409 }
                );
            }
        }

        const data: Prisma.RegionUpdateInput = {};
        if (code !== undefined) data.code = code.toUpperCase();
        if (nameEn !== undefined) data.nameEn = nameEn.trim();
        if (nameZh !== undefined) data.nameZh = nameZh.trim();
        if (imageUrl !== undefined)
            data.imageUrl = imageUrl === null ? null : imageUrl.trim();
        if (enabled !== undefined) data.enabled = enabled;

        const updated = await db.region.update({ where: { id }, data });

        return NextResponse.json({
            status: true,
            message: `已更新地區「${updated.nameZh}」`,
            data: updated,
        });
    } catch (e) {
        console.error('PUT /regions/[id] error:', e);
        return NextResponse.json({ error: '更新失敗' }, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest, { params }: Props) {
    const { id } = await params;
    if (!id || typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    try {
        const exists = await db.region.findUnique({ where: { id } });
        if (!exists) {
            return NextResponse.json({ error: '找不到地區' }, { status: 404 });
        }

        const { deletedRegion, removedAirports } = await db.$transaction(
            async (tx) => {
                // 先算有幾筆機場
                const removedAirports = await tx.airport.count({
                    where: { regionId: id },
                });
                // 刪掉該地區底下的所有機場
                await tx.airport.deleteMany({ where: { regionId: id } });
                // 再刪地區
                const deletedRegion = await tx.region.delete({ where: { id } });

                return { deletedRegion, removedAirports };
            }
        );

        return NextResponse.json({
            status: true,
            message: `已刪除地區「${deletedRegion.nameZh}」及其 ${removedAirports} 個機場`,
            data: deletedRegion,
        });
    } catch (e) {
        console.error('DELETE /regions/[id] error:', e);
        return NextResponse.json({ error: '刪除失敗' }, { status: 500 });
    }
}

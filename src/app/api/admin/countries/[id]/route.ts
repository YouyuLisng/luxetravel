// app/api/admin/countries/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

interface Props {
    params: Promise<{ id: string }>;
}

const UpdateSchema = z.object({
    code: z.string().trim().min(1).optional(),
    nameZh: z.string().trim().min(1).optional(),
    nameEn: z.string().trim().min(1).optional(),
    imageUrl: z.string().trim().url().optional().nullable(),
    enabled: z.boolean().optional(),
});

export async function GET(_req: NextRequest, { params }: Props) {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    try {
        const row = await db.country.findUnique({ where: { id } });
        if (!row) {
            return NextResponse.json(
                { status: false, message: '找不到國家' },
                { status: 404 }
            );
        }
        return NextResponse.json({ status: true, data: row });
    } catch (e) {
        console.error('GET /countries/[id] error:', e);
        return NextResponse.json({ error: '查詢失敗' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: Props) {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    try {
        const json = await req.json();
        const parsed = UpdateSchema.safeParse(json);
        if (!parsed.success) {
            const msg = parsed.error.issues[0]?.message ?? '資料驗證失敗';
            return NextResponse.json({ error: msg }, { status: 400 });
        }

        const existing = await db.country.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: '找不到國家' }, { status: 404 });
        }

        let nextCode = existing.code;
        if (parsed.data.code) nextCode = parsed.data.code.toUpperCase();

        // 若要變更 code，檢查唯一
        if (nextCode !== existing.code) {
            const dup = await db.country.findUnique({
                where: { code: nextCode },
            });
            if (dup) {
                return NextResponse.json(
                    { error: `代碼已存在：${nextCode}` },
                    { status: 409 }
                );
            }
        }

        const updated = await db.$transaction(async (tx) => {
            const data: Prisma.CountryUpdateInput = {};
            if (parsed.data.code !== undefined) data.code = nextCode;
            if (parsed.data.nameZh !== undefined)
                data.nameZh = parsed.data.nameZh.trim();
            if (parsed.data.nameEn !== undefined)
                data.nameEn = parsed.data.nameEn.trim();
            if (parsed.data.imageUrl !== undefined)
                data.imageUrl =
                    parsed.data.imageUrl === null
                        ? null
                        : parsed.data.imageUrl.trim();
            if (parsed.data.enabled !== undefined)
                data.enabled = parsed.data.enabled;

            const country = await tx.country.update({ where: { id }, data });

            // 同步 ArticleCountry（以「舊 nameEn」為 where，確保更新同一筆紀錄）
            const newNameEn = (parsed.data.nameEn ?? existing.nameEn).trim();
            const newNameZh = (parsed.data.nameZh ?? existing.nameZh).trim();
            const newCode = nextCode;

            await tx.articleCountry.upsert({
                where: { name: existing.nameEn }, // unique: 舊的 name（若改名也能對到同一筆）
                update: { name: newNameEn, nameZh: newNameZh, code: newCode },
                create: { name: newNameEn, nameZh: newNameZh, code: newCode },
            });

            return country;
        });

        return NextResponse.json({
            status: true,
            message: `已更新國家「${updated.nameZh}」`,
            data: updated,
        });
    } catch (e) {
        console.error('PUT /countries/[id] error:', e);
        return NextResponse.json({ error: '更新失敗' }, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest, { params }: Props) {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    try {
        const result = await db.$transaction(async (tx) => {
            const existing = await tx.country.findUnique({ where: { id } });
            if (!existing) return { country: null };

            // 找到對應的 ArticleCountry（以舊 nameEn 或 code 匹配）
            const ac = await tx.articleCountry.findFirst({
                where: { name: existing.nameEn },
            });

            // 刪 Country
            const deleted = await tx.country.delete({ where: { id } });

            // 嘗試刪 ArticleCountry（若有被使用則跳過）
            if (ac) {
                const used = await tx.travelArticleOnCountry.count({
                    where: { countryId: ac.id },
                });
                if (used === 0) {
                    await tx.articleCountry.delete({ where: { id: ac.id } });
                }
            }

            return { country: deleted };
        });

        if (!result.country) {
            return NextResponse.json({ error: '找不到國家' }, { status: 404 });
        }

        return NextResponse.json({
            status: true,
            message: `已刪除國家「${result.country.nameZh}」`,
            data: result.country,
        });
    } catch (e) {
        console.error('DELETE /countries/[id] error:', e);
        return NextResponse.json({ error: '刪除失敗' }, { status: 500 });
    }
}

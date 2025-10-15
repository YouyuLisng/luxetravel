import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
    SubCategoryEditSchema,
    type SubCategoryEditValues,
} from '@/schemas/subCategory';

interface Props {
    params: Promise<{ id: string }>;
}

/** GET /api/admin/sub-category/[id] - 取得單筆 */
export async function GET(_req: NextRequest, { params }: Props) {
    const { id } = await params;
    try {
        const data = await db.subCategory.findUnique({ where: { id } });
        if (!data)
            return NextResponse.json(
                { status: false, message: '找不到小分類' },
                { status: 404 }
            );

        return NextResponse.json({ status: true, data });
    } catch (err) {
        console.error('GET /sub-category/[id] error:', err);
        return NextResponse.json(
            { status: false, message: '讀取失敗' },
            { status: 500 }
        );
    }
}

/** PUT /api/admin/sub-category/[id] - 更新 */
export async function PUT(req: NextRequest, { params }: Props) {
    const { id } = await params;
    try {
        const body = await req.json();
        const parsed = SubCategoryEditSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { status: false, message: '欄位格式錯誤' },
                { status: 400 }
            );
        }

        const exists = await db.subCategory.findUnique({ where: { id } });
        if (!exists) {
            return NextResponse.json(
                { status: false, message: '找不到小分類' },
                { status: 404 }
            );
        }

        const { code, nameZh, nameEn, imageUrl, enabled, categoryId } =
            parsed.data as SubCategoryEditValues;

        // 檢查代碼唯一
        if (code !== undefined) {
            const upper = code.toUpperCase();
            if (upper !== exists.code) {
                const dup = await db.subCategory.findUnique({
                    where: { code: upper },
                });
                if (dup)
                    return NextResponse.json(
                        { status: false, message: `代碼已存在：${upper}` },
                        { status: 400 }
                    );
            }
        }

        // 檢查 category 是否存在
        if (categoryId !== undefined) {
            const categoryExists = await db.category.findUnique({
                where: { id: categoryId },
            });
            if (!categoryExists) {
                return NextResponse.json(
                    { status: false, message: '找不到對應的大分類' },
                    { status: 400 }
                );
            }
        }

        const patch: Partial<SubCategoryEditValues> = {};
        if (code !== undefined) patch.code = code.toUpperCase();
        if (nameZh !== undefined) patch.nameZh = nameZh.trim();
        if (nameEn !== undefined) patch.nameEn = nameEn.trim();
        if (imageUrl !== undefined)
            patch.imageUrl = imageUrl === null ? null : imageUrl.trim();
        if (enabled !== undefined) patch.enabled = enabled;
        if (categoryId !== undefined) patch.categoryId = categoryId;

        const data = await db.subCategory.update({
            where: { id },
            data: patch,
        });

        return NextResponse.json({ status: true, data });
    } catch (err) {
        console.error('PUT /sub-category/[id] error:', err);
        return NextResponse.json(
            { status: false, message: '更新失敗' },
            { status: 500 }
        );
    }
}

/** DELETE /api/admin/sub-category/[id] - 刪除 */
export async function DELETE(_req: NextRequest, { params }: Props) {
    const { id } = await params;
    try {
        const exists = await db.subCategory.delete({
            where: { id },
            select: { id: true, nameZh: true },
        });
        if (!exists)
            return NextResponse.json(
                { status: false, message: '找不到小分類' },
                { status: 404 }
            );

        return NextResponse.json({
            status: true,
            message: `刪除成功：${exists.nameZh}`,
            data: exists,
        });
    } catch (err) {
        console.error('DELETE /sub-category/[id] error:', err);
        return NextResponse.json(
            { status: false, message: '刪除失敗' },
            { status: 500 }
        );
    }
}

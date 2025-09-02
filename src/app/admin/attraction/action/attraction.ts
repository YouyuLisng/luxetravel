'use server';

import { db } from '@/lib/db';
import {
    AttractionCreateSchema,
    AttractionEditSchema,
    type AttractionCreateValues,
    type AttractionEditValues,
} from '@/schemas/attraction';

/** 新增 Attraction（僅檢查 code 唯一） */
export async function createAttraction(values: AttractionCreateValues) {
    const parsed = AttractionCreateSchema.safeParse(values);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const data = parsed.data;

    // 檢查 code 唯一（有填才檢查）
    if (data.code) {
        const up = data.code.toUpperCase();
        const dup = await db.attraction.findUnique({ where: { code: up } });
        if (dup) return { error: `代碼已存在：${up}` };
        data.code = up;
    }

    const created = await db.attraction.create({ data });
    return { success: '新增成功', data: created };
}

/** 編輯 Attraction（依 id；僅檢查 code 唯一） */
export async function editAttraction(id: string, values: AttractionEditValues) {
    if (!id) return { error: '無效的 ID' };

    const parsed = AttractionEditSchema.safeParse(values);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const data = parsed.data;

    // 檢查 code 唯一（有更新且不同才檢查）
    if (data.code !== undefined && data.code !== null) {
        const up = data.code.toUpperCase();
        const exists = await db.attraction.findUnique({ where: { id } });
        if (!exists) return { error: '找不到 Attraction' };
        if (up !== exists.code) {
            const dup = await db.attraction.findUnique({ where: { code: up } });
            if (dup) return { error: `代碼已存在：${up}` };
        }
        data.code = up;
    }

    const updated = await db.attraction.update({ where: { id }, data });
    return { success: '更新成功', data: updated };
}

/** 刪除 Attraction（依 id） */
export async function deleteAttraction(id: string) {
    if (!id) return { error: '無效的 ID' };

    const exists = await db.attraction.findUnique({ where: { id } });
    if (!exists) return { error: '找不到 Attraction' };

    const deleted = await db.attraction.delete({ where: { id } });
    return { success: '刪除成功', data: deleted };
}

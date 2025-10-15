'use server';

import { db } from '@/lib/db';
import {
    LexiconCreateSchema,
    LexiconEditSchema,
    type LexiconCreateValues,
    type LexiconEditValues,
} from '@/schemas/lexicon';

/** 新增 Lexicon */
export async function createLexicon(values: LexiconCreateValues) {
    const parsed = LexiconCreateSchema.safeParse(values);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const { title, type, context } = parsed.data;

    // 同一 type 下 title 唯一
    const dup = await db.lexicon.findFirst({
        where: { type, title },
    });
    if (dup) return { error: `此類型下已存在同名辭庫：${title}` };

    const data = await db.lexicon.create({
        data: {
            title: title.trim(),
            type: type.trim(),
            context: context.trim(),
        },
    });

    return { success: '新增成功', data };
}

/** 編輯 Lexicon（依 id） */
export async function editLexicon(id: string, values: LexiconEditValues) {
    if (!id) return { error: '無效的 ID' };

    const parsed = LexiconEditSchema.safeParse(values);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const exists = await db.lexicon.findUnique({ where: { id } });
    if (!exists) return { error: '找不到 Lexicon' };

    const { title, type, context } = parsed.data;

    // 如果更新 title 或 type，要檢查唯一性
    if ((title && title !== exists.title) || (type && type !== exists.type)) {
        const dup = await db.lexicon.findFirst({
            where: {
                type: type ?? exists.type,
                title: title ?? exists.title,
                NOT: { id },
            },
        });
        if (dup)
            return {
                error: `此類型下已存在同名辭庫：${title ?? exists.title}`,
            };
    }

    const patch: {
        title?: string;
        type?: string;
        context?: string;
    } = {};

    if (title !== undefined) patch.title = title.trim();
    if (type !== undefined) patch.type = type.trim();
    if (context !== undefined) patch.context = context.trim();

    const data = await db.lexicon.update({ where: { id }, data: patch });
    return { success: '更新成功', data };
}

/** 刪除 Lexicon（依 id） */
export async function deleteLexicon(id: string) {
    if (!id) return { error: '無效的 ID' };

    const exists = await db.lexicon.findUnique({ where: { id } });
    if (!exists) return { error: '找不到 Lexicon' };

    const data = await db.lexicon.delete({ where: { id } });
    return { success: '刪除成功', data };
}

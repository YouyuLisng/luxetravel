// src/app/admin/modules/action/Module.ts
'use server';

import { db } from '@/lib/db';
import {
    ModuleCreateSchema,
    ModuleEditSchema,
    type ModuleCreateValues,
    type ModuleEditValues,
} from '@/schemas/module';

/** 新增 Module（只 export async function） */
export async function createModule(values: ModuleCreateValues) {
    const parsed = ModuleCreateSchema.safeParse(values);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const { key, title, subtitle, type } = parsed.data;

    const exists = await db.module.findUnique({ where: { key } });
    if (exists) return { error: 'Key 已存在' };

    const data = await db.module.create({
        data: {
            key: key.toLowerCase(),
            title,
            subtitle: subtitle || null,
            type,
        },
    });

    return { success: '新增成功', data };
}

/** 編輯 Module（只更新 title / subtitle） */
export async function editModule(id: string, values: ModuleEditValues) {
    if (!id) return { error: '無效的 ID' };

    const parsed = ModuleEditSchema.safeParse(values);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const target = await db.module.findUnique({ where: { id } });
    if (!target) return { error: '找不到 Module' };

    const { title, subtitle } = parsed.data;

    const data = await db.module.update({
        where: { id },
        data: { title, subtitle: subtitle || null },
    });

    return { success: '更新成功', data };
}

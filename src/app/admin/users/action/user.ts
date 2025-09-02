'use server';

import { db } from '@/lib/db';
import {
    UserCreateSchema,
    UserEditSchema,
    type UserCreateValues,
    type UserEditValues,
} from '@/schemas/user';
import { Prisma } from '@prisma/client';
import { hash } from 'bcryptjs';

const userSelect = {
    id: true,
    name: true,
    email: true,
    image: true,
    role: true,
    emailVerified: true,
    createdAt: true,
    updatedAt: true,
} as const;

const normalizeEmail = (s: string) => s.trim().toLowerCase();

/** 新增使用者（後台直接開通） */
export async function createUser(values: UserCreateValues) {
    const parsed = UserCreateSchema.safeParse(values);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const { email, password, name, image, role } = parsed.data;

    try {
        const data = await db.user.create({
            data: {
                email: normalizeEmail(email),
                // 後台開通：直接視為已驗證
                emailVerified: new Date(),
                // 密碼入庫前先雜湊
                password: await hash(password, 12),
                name: name || null,
                image: image || null,
                // Prisma 會用 schema 內的 default(USER)，這裡允許覆蓋
                ...(role ? { role } : {}),
            },
            select: userSelect,
        });

        return { success: '新增成功', data };
    } catch (err) {
        if (
            err instanceof Prisma.PrismaClientKnownRequestError &&
            err.code === 'P2002'
        ) {
            return { error: 'Email 已被使用' };
        }
        console.error('createUser error:', err);
        return { error: '建立失敗，請稍後重試' };
    }
}

/** 編輯使用者（依 id） */
export async function editUser(id: string, values: UserEditValues) {
    if (!id) return { error: '無效的 ID' };

    const parsed = UserEditSchema.safeParse(values);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const exists = await db.user.findUnique({ where: { id } });
    if (!exists) return { error: '找不到使用者' };

    const { email, password, name, image, role, verifyNow } = parsed.data;

    try {
        const data = await db.user.update({
            where: { id },
            data: {
                ...(typeof name !== 'undefined' ? { name: name || null } : {}),
                ...(typeof image !== 'undefined'
                    ? { image: image || null }
                    : {}),
                ...(typeof role !== 'undefined' ? { role } : {}),
                ...(email ? { email: normalizeEmail(email) } : {}),
                ...(password ? { password: await hash(password, 12) } : {}),
                ...(verifyNow ? { emailVerified: new Date() } : {}),
            },
            select: userSelect,
        });

        return { success: '更新成功', data };
    } catch (err) {
        if (
            err instanceof Prisma.PrismaClientKnownRequestError &&
            err.code === 'P2002'
        ) {
            return { error: 'Email 已被使用' };
        }
        console.error('editUser error:', err);
        return { error: '更新失敗，請稍後重試' };
    }
}

/** 刪除使用者（依 id）— 會連動刪除 sessions / accounts（schema 已設 onDelete: Cascade） */
export async function deleteUser(id: string) {
    if (!id) return { error: '無效的 ID' };

    const exists = await db.user.findUnique({ where: { id } });
    if (!exists) return { error: '找不到使用者' };

    try {
        const data = await db.user.delete({
            where: { id },
            select: userSelect,
        });
        return { success: '刪除成功', data };
    } catch (err) {
        console.error('deleteUser error:', err);
        return { error: '刪除失敗，請稍後重試' };
    }
}

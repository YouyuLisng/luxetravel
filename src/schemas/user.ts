// src/schemas/user.ts
import { z } from 'zod';
import { Role } from '@prisma/client';

/**
 * 將空字串或純空白字串轉成 undefined，再做 URL 驗證；
 * 這樣表單留白就不會報錯，真的有填才驗證網址格式。
 */
const OptionalImageUrl = z.preprocess((val) => {
    if (val === null || typeof val === 'undefined') return undefined;
    if (typeof val === 'string' && val.trim() === '') return undefined;
    return val;
}, z.string().url().optional().nullable());

export const UserCreateSchema = z.object({
    name: z.string().max(50).optional(),
    email: z.string().email(),
    password: z.string().min(8, '密碼需至少 8 碼').max(72),
    role: z.nativeEnum(Role).optional(),
    image: OptionalImageUrl,
});
export type UserCreateValues = z.infer<typeof UserCreateSchema>;

export const UserEditSchema = z.object({
    name: z.string().max(50).optional(),
    email: z.string().email().optional(),
    password: z.string().min(8).max(72).optional(),
    role: z.nativeEnum(Role).optional(),
    image: OptionalImageUrl,
    verifyNow: z.boolean().optional(),
});
export type UserEditValues = z.infer<typeof UserEditSchema>;

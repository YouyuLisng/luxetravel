'use server';

import * as z from 'zod';
import { signIn } from '@/auth';
import { LoginSchema } from '@/schemas';
import { DEFAULT_LOGIN_REDIRECT } from '@/routes';
import { generateVerificationToken } from '@/lib/tokens';
import { getUserByEmail } from '@/data/user';
import { sendVerificationEmail } from '@/lib/mail';

export const login = async (values: z.infer<typeof LoginSchema>) => {
    const validatedFields = LoginSchema.safeParse(values);

    if (!validatedFields.success) {
        return { error: '欄位格式錯誤，請檢查輸入內容' };
    }

    const { email, password } = validatedFields.data;

    const existingUser = await getUserByEmail(email);

    if (!existingUser || !existingUser.email || !existingUser.password) {
        return { error: '此 Email 尚未註冊，請先註冊帳號' };
    }

    // ✅ 未驗證者自動重寄驗證信
    if (!existingUser.emailVerified) {
        const verificationToken = await generateVerificationToken(
            existingUser.email
        );
        await sendVerificationEmail(
            verificationToken.email,
            verificationToken.token
        );

        return {
            error: '此 Email 尚未驗證，請至信箱取得驗證連結',
        };
    }

    try {
        // ✅ 使用 credentials 嘗試登入，不要加 redirectTo（否則你無法手動跳轉）
        await signIn('credentials', {
            email,
            password,
            redirect: false, // 很關鍵！
        });

        return {
            success: '登入成功',
            redirectUrl: DEFAULT_LOGIN_REDIRECT, // 你在前端收到這個後再使用 router.push()
        };
    } catch (error: any) {
        const rawError = error?.message || '未知錯誤';
        const cleanError = rawError.replace(
            /\.?\s*Read more at https:\/\/.*$/,
            ''
        );

        return {
            error: cleanError || '登入失敗，請確認帳號密碼，或帳號是否已驗證',
        };
    }
};

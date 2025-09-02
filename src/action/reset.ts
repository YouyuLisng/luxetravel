'use server';
import * as z from 'zod';
import { ResetSchema } from '@/schemas';
import { getUserByEmail } from '@/data/user';
import { generateResetPasswordToken } from '@/lib/tokens';
import { sendResetPasswordEmail } from '@/lib/mail';

export const reset = async (values: z.infer<typeof ResetSchema>) => {
    const validatedFields = ResetSchema.safeParse(values);
    if (!validatedFields.success) {
        return { error: '欄位格式錯誤，請檢查輸入內容' };
    }

    const { email } = validatedFields.data;
    const existingUser = await getUserByEmail(email);

    if (!existingUser) {
        return { error: '此 Email 尚未註冊，請先註冊帳號' };
    }

    const resetToken = await generateResetPasswordToken(email);
    await sendResetPasswordEmail(resetToken.email, resetToken.token);

    return { success: '重置密碼的連結已發送到您的電子郵件' };
};

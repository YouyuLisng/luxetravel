"use server";
import * as z from "zod";
import { RegisterAdminSchema } from "@/schemas";
import bcrypt from 'bcryptjs'
import { db } from "@/lib/db";
import { getUserByEmail } from "@/data/user";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";

export const register = async (values: z.infer<typeof RegisterAdminSchema>) => {
    const validatedFields = RegisterAdminSchema.safeParse(values);

    if (!validatedFields.success) {
        return { error: "Invalid fields！" };
    }

    const { name, email, password } = validatedFields.data;
    const hashedPassword = await bcrypt.hash(password, 10);

    const existingUser = await getUserByEmail(email);

    if (existingUser) return { error: "此 Email 已經被使用了！" };

    await db.user.create({
        data: {
            name,
            email,
            role: 'ADMIN',
            password: hashedPassword,
        }
    });

    const verificationToken = await generateVerificationToken(email);
    await sendVerificationEmail(verificationToken.email, verificationToken.token);

    return { success: "註冊成功！請至信箱取得驗證連結" };
};

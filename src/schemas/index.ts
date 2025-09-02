import * as z from "zod"

export const NewPasswordSchema = z.object({
    password: z.string().min(6, { message: "密碼長度最少要6位數." }),
});

export const ResetSchema = z.object({
    email: z.string().min(1, { message: "電子郵件不得為空." }),
});

export const LoginSchema = z.object({
    email: z.string().min(1, { message: "電子郵件不得為空." }),
    password: z.string().min(6, { message: "密碼不得為空." }),
});

export const RegisterSchema = z.object({
    name: z.string().min(1, { message: "姓名不得為空." }),
    email: z.string().min(1, { message: "電子郵件不得為空." }),
    password: z.string().min(6, { message: "密碼長度最少要6位數." }),
});

export const RegisterAdminSchema = z.object({
    name: z.string().min(1, { message: "姓名不得為空." }),
    email: z.string().min(1, { message: "電子郵件不得為空." }),
    password: z.string().min(6, { message: "密碼長度最少要6位數." }),
});

export const MenuSchema = z.object({
    title: z.string().min(1, '標題為必填'),
    slug: z.string().optional().or(z.literal('')),
    linkUrl: z.string().url().optional().or(z.literal('')),
    icon: z.string().optional().or(z.literal('')),
    order: z.coerce.number().default(0),
    isActive: z.boolean().default(true),
    parentId: z.string().optional().nullable(),
});

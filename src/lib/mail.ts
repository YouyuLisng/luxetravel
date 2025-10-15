import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendResetPasswordEmail = async (email: string, token: string) => {
    const resetLink = `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/new-password?token=${token}`;

    await resend.emails.send({
        from: "onboarding@resend.dev",
        to: email,
        subject: "請重設您的密碼",
        html: `
            <p>您好，</p>
            <p>請點擊以下連結以重設您的密碼：</p>
            <a href="${resetLink}">重設密碼</a>
            <p>如果您沒有請求此操作，請忽略此郵件。</p>
            <p>謝謝！</p>
        `,
    })
}

export const sendVerificationEmail = async (email: string, token: string) => {
    const confirmLink = `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/new-verification?token=${token}`;

    await resend.emails.send({
        from: "onboarding@resend.dev",
        to: email,
        subject: "請驗證您的電子郵件地址",
        html: `
            <p>您好，</p>
            <p>請點擊以下連結以驗證您的電子郵件地址：</p>
            <a href="${confirmLink}">驗證電子郵件地址</a>
            <p>如果您沒有請求此操作，請忽略此郵件。</p>
            <p>謝謝！</p>
        `,
    })
}
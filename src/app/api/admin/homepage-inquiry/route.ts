import { NextResponse } from 'next/server';
import { CarInquirySchema, type CarInquiryValues } from '@/schemas/carInquiry';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';

/** POST /api/admin/home-inquiry - 收到需求單並寄出 Email */
export async function POST(req: Request) {
    try {
        const json = (await req.json()) as CarInquiryValues;
        const parsed = CarInquirySchema.safeParse(json);
        if (!parsed.success) {
            return NextResponse.json(
                { error: '欄位格式錯誤' },
                { status: 400 }
            );
        }

        const d = parsed.data;

        // ===== 讀取並編譯 hbs 模板 =====
        const templatePath = path.join(
            process.cwd(),
            'templates',
            'home-inquiry.hbs'
        );
        const source = fs.readFileSync(templatePath, 'utf8');
        const template = Handlebars.compile(source);

        // 把表單資料帶入模板
        const mailHtml = template({
            ...d,
            lineId: d.lineId ?? '-',
            contactMethod: d.contactMethod?.join(', ') ?? '-',
            source: d.source?.join(', ') ?? '-',
            wishlist: d.wishlist ?? '-',
            note: d.note ?? '-',
        });

        // ===== 建立寄件器 =====
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        // ===== 寄出信件 =====
        await transporter.sendMail({
            from: `"網站表單通知" <${process.env.SMTP_USER}>`,
            to: process.env.NOTIFY_EMAIL ?? 'info@luxetravel.com.tw',
            replyTo: process.env.REPLY_TO ?? process.env.SMTP_USER,
            subject: `典藏旅遊｜感謝您的旅遊諮詢，我們已收到您的需求`,
            html: mailHtml,
        });

        return NextResponse.json({ success: '需求單已送出並寄信通知' });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: '寄送失敗' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';

import { CarInquirySchema, type CarInquiryValues } from '@/schemas/carInquiry';
import {
    TravelInquirySchema,
    type TravelInquiryValues,
} from '@/schemas/travelInquiry';

type FormType = 'car' | 'travel';
type InquiryValues = CarInquiryValues | TravelInquiryValues;

/** POST /api/inquiry - 收到需求單並寄出 Email */
export async function POST(req: Request) {
    try {
        const json = await req.json();

        // 判斷是哪個表單類型
        const formType = json.formType as FormType | undefined;
        if (!formType || !['car', 'travel'].includes(formType)) {
            return NextResponse.json(
                { error: '缺少或錯誤的 formType 參數' },
                { status: 400 }
            );
        }

        // 根據類型選擇 Schema 與模板
        const schema =
            formType === 'car' ? CarInquirySchema : TravelInquirySchema;
        const templateFile =
            formType === 'car' ? 'car-inquiry.hbs' : 'travel-inquiry.hbs';

        // 驗證資料
        const parsed = schema.safeParse(json);
        if (!parsed.success) {
            console.error('❌ Schema 驗證失敗:', parsed.error.format());
            return NextResponse.json(
                { error: '欄位格式錯誤' },
                { status: 400 }
            );
        }

        const d = parsed.data as InquiryValues;

        // ===== 讀取並編譯 hbs 模板 =====
        // ⚠️ 若模板放在 src/templates，請保持這樣
        const templatePath = path.join(
            process.cwd(),
            'src',
            'templates',
            templateFile
        );
        if (!fs.existsSync(templatePath)) {
            console.error('❌ 找不到模板檔案：', templatePath);
            return NextResponse.json(
                { error: `模板檔案不存在 (${templateFile})` },
                { status: 500 }
            );
        }

        const source = fs.readFileSync(templatePath, 'utf8');
        const template = Handlebars.compile(source);

        // ===== 填入模板變數 =====
        const mailHtml = template({
            ...d,
            gender: (d as any).gender ?? '',
            lineId: d.lineId ?? '-',
            contactMethod: Array.isArray(d.contactMethod)
                ? d.contactMethod.join(', ')
                : '-',
            source: Array.isArray(d.source) ? d.source.join(', ') : '-',
            wishlist: (d as any).wishlist ?? '-',
            note: (d as any).note ?? '-',
            email: (d as any).email ?? '-',
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

        console.log(`✅ 成功寄出 ${formType} 表單通知信`);

        return NextResponse.json({
            success: `需求單已送出 (${formType}) 並寄信通知`,
        });
    } catch (err: any) {
        console.error('❌ 寄送失敗：', err);
        return NextResponse.json(
            { error: `寄送失敗：${err.message}` },
            { status: 500 }
        );
    }
}

import { NextResponse } from 'next/server';
import {
    TravelInquirySchema,
    type TravelInquiryValues,
} from '@/schemas/travelInquiry';
import nodemailer from 'nodemailer';

/** POST /api/admin/travel-inquiry - 收到需求單並寄出 Email */
export async function POST(req: Request) {
    try {
        const json = (await req.json()) as TravelInquiryValues;
        const parsed = TravelInquirySchema.safeParse(json);
        if (!parsed.success) {
            return NextResponse.json(
                { error: '欄位格式錯誤' },
                { status: 400 }
            );
        }

        // ===== 建立 Email transporter =====
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT ?? '465', 10),
            secure: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        // ===== 信件內容 =====
        const d = parsed.data;
        const mailHtml = `
            <h2>新的旅遊需求單</h2>
            <p><b>聯絡人：</b>${d.contactName} ${d.gender ?? ''}</p>
            <p><b>旅遊形式：</b>${d.travelType}</p>
            <p><b>聯絡方式：</b>${d.contactMethod.join(', ') || '-'}</p>
            <p><b>聯絡時間：</b>${d.contactTime}</p>
            <p><b>來源：</b>${d.source.join(', ') || '-'}</p>
            <p><b>需求說明：</b>${d.note ?? '-'}</p>
            <p><b>人數：</b>大人 ${d.adults} 小孩 ${d.children} 嬰兒 ${d.infants}</p>
            <p><b>期望行程：</b>${d.itinerary}</p>
            <p><b>出發日期：</b>${d.departDate}</p>
            <p><b>手機：</b>${d.phone}</p>
            <p><b>LINE：</b>${d.lineId ?? '-'}</p>
        `;

        // ===== 寄出信件 =====
        await transporter.sendMail({
            from: `"網站表單通知" <${process.env.SMTP_USER}>`,
            to: process.env.NOTIFY_EMAIL ?? 'info@luxetravel.com.tw',
            replyTo: process.env.REPLY_TO ?? process.env.SMTP_USER,
            subject: `新旅遊需求單 - ${d.contactName}`,
            html: mailHtml,
        });

        return NextResponse.json({ success: '需求單已送出並寄信通知' });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: '寄送失敗' }, { status: 500 });
    }
}

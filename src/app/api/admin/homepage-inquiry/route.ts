import { NextResponse } from 'next/server';
import { CarInquirySchema, type CarInquiryValues } from '@/schemas/carInquiry';
import nodemailer from 'nodemailer';

/** POST /api/admin/car-inquiry - 收到包車需求單並寄出 Email */
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

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.SMTP_USER, // luxetravel@gmail.com
                pass: process.env.SMTP_PASS, // ehtpldceklyosovt
            },
        });

        const d = parsed.data;
        const mailHtml = `
            <h2>新的包車需求單</h2>
            <p><b>聯絡人：</b>${d.contactName} ${d.gender}</p>
            <p><b>手機：</b>${d.phone}</p>
            <p><b>LINE：</b>${d.lineId ?? '-'}</p>
            <p><b>聯絡方式：</b>${d.contactMethod.join(', ')}</p>
            <p><b>聯絡時間：</b>${d.contactTime ?? '-'}</p>
            <p><b>來源：</b>${d.source.join(', ')}</p>
            <p><b>每人預算：</b>${d.budget}</p>
            <p><b>想去的地區：</b>${d.regions.join(', ')}</p>
            <p><b>人數：</b>大人 ${d.adults} 小孩 ${d.children}</p>
            <p><b>旅遊天數：</b>${d.days} 天</p>
            <p><b>出發日期：</b>${d.departDate}</p>
            <p><b>心願清單：</b>${d.wishlist ?? '-'}</p>
            <p><b>其他需求：</b>${d.note ?? '-'}</p>
        `;

        await transporter.sendMail({
            from: `"網站表單通知" <${process.env.SMTP_USER}>`,
            to: process.env.NOTIFY_EMAIL ?? 'info@luxetravel.com.tw',
            replyTo: process.env.REPLY_TO ?? process.env.SMTP_USER, // ⬅️ 使用 env
            subject: `新包車需求單 - ${d.contactName}`,
            html: mailHtml,
        });

        return NextResponse.json({ success: '包車需求單已送出並寄信通知' });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: '寄送失敗' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/** GET /api/admin/feedback/all - 取得所有 Feedback */
export async function GET() {
    try {
        const feedbacks = await db.feedback.findMany({
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ status: true, rows: feedbacks });
    } catch (err) {
        console.error('GET /feedback/all error:', err);
        return NextResponse.json(
            { status: false, message: '讀取失敗' },
            { status: 500 }
        );
    }
}

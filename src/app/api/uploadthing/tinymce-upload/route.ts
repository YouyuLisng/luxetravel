import { NextResponse } from 'next/server';
import { UTApi } from 'uploadthing/server';

const utapi = new UTApi();

export async function POST(req: Request) {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
        return NextResponse.json({ error: '未提供圖片' }, { status: 400 });
    }

    const uploadRes = await utapi.uploadFiles([file]);
    const ufsUrl = uploadRes?.[0]?.data?.ufsUrl; // ✅ 使用 ufsUrl

    if (!ufsUrl) {
        return NextResponse.json({ error: '上傳失敗' }, { status: 500 });
    }

    return NextResponse.json({ ufsUrl }); // ✅ 回傳 ufsUrl 給前端
}

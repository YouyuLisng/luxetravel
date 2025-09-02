// /app/api/uploadthing/delete/route.ts
import { NextResponse } from 'next/server';
import { UTApi } from 'uploadthing/server'; // 你的 utapi 實例

const utapi = new UTApi();

export async function POST(req: Request) {
    const { url } = await req.json();

    const key = url.split('/').pop(); // 從網址中取出檔名作為 key
    if (!key)
        return NextResponse.json({ error: '無效的圖片網址' }, { status: 400 });

    try {
        await utapi.deleteFiles(key);
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: '刪除失敗' }, { status: 500 });
    }
}

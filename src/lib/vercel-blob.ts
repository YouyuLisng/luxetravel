import { del } from '@vercel/blob';

/**
 * 刪除 Vercel Blob 檔案
 * @param url - 可以是完整 URL 或 pathname
 */
export async function deleteFromVercelBlob(url: string) {
    try {
        if (!url || typeof url !== 'string') {
            console.warn('⚠️ 無效的 URL，略過刪除:', url);
            return;
        }

        // 取出最後一段 pathname（移除查詢參數）
        const pathname = url.split('?')[0].split('/').pop();
        if (!pathname) {
            console.warn('⚠️ 無法解析 blob 檔名，略過刪除:', url);
            return;
        }

        await del(pathname, {
            token: process.env.VERCEL_BLOB_READ_WRITE_TOKEN,
        });

        console.log('✅ 已刪除 blob:', pathname);
    } catch (err) {
        console.error('❌ Failed to delete from Vercel Blob:', err);
    }
}

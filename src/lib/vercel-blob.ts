import { del } from '@vercel/blob';

/**
 * 刪除 Vercel Blob 上的檔案
 * @param url 完整的 blob URL (例如：https://<your-project>.public.blob.vercel-storage.com/xxxx.png)
 */
export async function deleteFromVercelBlob(url: string) {
    try {
        await del(url);
        console.log('Vercel Blob deleted:', url);
    } catch (err) {
        console.error('Failed to delete from Vercel Blob:', err);
    }
}

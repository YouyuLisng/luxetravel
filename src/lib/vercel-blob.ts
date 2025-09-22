import { del } from '@vercel/blob';

export async function deleteFromVercelBlob(url: string) {
    try {
        await del(url);
    } catch (err) {
        console.error('Failed to delete from Vercel Blob:', err);
    }
}

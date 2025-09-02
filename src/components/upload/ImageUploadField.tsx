'use client';

import { UploadButton } from '@uploadthing/react';
import type { OurFileRouter } from '@/app/api/uploadthing/core';
import { Button } from '@/components/ui/button';
import { Trash2, UploadCloud, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface Props {
    value: string | string[] | null;
    onChange: (value: string | string[]) => void;
    multiple?: boolean;
    className?: string;
}

export const ImageUploadField = ({
    value,
    onChange,
    multiple = false,
    className,
}: Props) => {
    const [isUploading, setIsUploading] = useState(false);
    const { toast } = useToast();

    const images: string[] =
        !value || (typeof value === 'string' && value.trim() === '')
            ? []
            : Array.isArray(value)
            ? value
            : [value];

    const handleUpload = (res: any) => {
        const urls = res.map((r: any) => r.url);
        const newValue = multiple ? [...images, ...urls] : urls[0];
        onChange(newValue);
        setIsUploading(false);
        toast({
            variant: "success",
            title: '圖片上傳成功',
            description: '檔案已成功上傳',
            duration: 3000,
        });
    };

    const deleteFromUploadThing = async (url: string) => {
        try {
            await fetch('/api/uploadthing/delete', {
                method: 'POST',
                body: JSON.stringify({ url }),
                headers: { 'Content-Type': 'application/json' },
            });
            toast({
                variant: "success",
                title: '圖片刪除成功',
                description: '檔案已成功刪除',
                duration: 5000,
            });
        } catch (err) {
            console.error('刪除 uploadthing 檔案失敗:', err);
            toast({
                variant: "destructive",
                title: '圖片刪除失敗',
                description: `'刪除圖片檔案失敗:', ${err}`,
                duration: 5000,
            });
        }
    };

    const handleRemove = async (url: string) => {
        await deleteFromUploadThing(url);
        if (multiple) {
            const updated = images.filter((img) => img !== url);
            onChange(updated);
        } else {
            onChange('');
        }
    };

    const shouldShowUploadButton = multiple || images.length === 0;

    return (
        <div className={cn('space-y-2', className)}>
            {/* 預覽 */}
            <div className="flex flex-wrap gap-2">
                {images.map((url) => (
                    <div
                        key={url}
                        className="relative rounded border overflow-hidden max-w-xs"
                    >
                        <img
                            src={url}
                            alt="preview"
                            className="max-w-full h-auto object-contain"
                        />
                        <Button
                            type="button"
                            size="icon"
                            variant="destructive"
                            className="absolute top-0 right-0 rounded-none"
                            onClick={() => handleRemove(url)}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                ))}
            </div>

            {/* 上傳按鈕 */}
            {shouldShowUploadButton && (
                <div
                    className={cn(
                        'relative inline-flex items-center gap-2 border border-dashed rounded px-3 py-2 text-muted-foreground transition',
                        isUploading
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:bg-muted'
                    )}
                >
                    {isUploading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>上傳中...</span>
                        </>
                    ) : (
                        <>
                            <UploadCloud className="w-4 h-4" />
                            <span>上傳圖片</span>
                        </>
                    )}
                    <UploadButton<OurFileRouter, 'serverImage'>
                        endpoint="serverImage"
                        onClientUploadComplete={handleUpload}
                        onUploadBegin={() => setIsUploading(true)}
                        onUploadError={(err) => {
                            alert(`上傳失敗：${err.message}`);
                            setIsUploading(false);
                        }}
                        appearance={{
                            container:
                                'absolute inset-0 w-full h-full opacity-0 cursor-pointer',
                            button: 'w-full h-full',
                        }}
                    />
                </div>
            )}
        </div>
    );
};

'use client';

import { UploadButton } from '@uploadthing/react';
import type { OurFileRouter } from '@/app/api/uploadthing/core';
import { Button } from '@/components/ui/button';
import { Trash2, UploadCloud, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface CoverImageUploadProps {
    value: string | null;
    onChange: (value: string) => void;
    className?: string;
}

export const CoverImageUpload = ({
    value,
    onChange,
    className,
}: CoverImageUploadProps) => {
    const [isUploading, setIsUploading] = useState(false);
    const { toast } = useToast();

    const hasImage = !!value && value.trim() !== '';

    const handleUpload = (res: any) => {
        const url = res?.[0]?.url;
        if (url) {
            onChange(url);
            toast({
                title: '封面圖片上傳成功',
                description: '圖片已成功設定',
                variant: 'default',
                duration: 4000,
            });
        }
        setIsUploading(false);
    };

    const deleteFromUploadThing = async (url: string) => {
        try {
            await fetch('/api/uploadthing/delete', {
                method: 'POST',
                body: JSON.stringify({ url }),
                headers: { 'Content-Type': 'application/json' },
            });
        } catch (err) {
            toast({
                title: '圖片刪除失敗',
                description: '無法刪除圖片，請稍後再試',
                variant: 'destructive',
            });
            console.error('UploadThing 刪除失敗:', err);
        }
    };

    const handleRemove = async () => {
        if (!value) return;
        await deleteFromUploadThing(value);
        onChange('');
        toast({
            title: '封面圖片已移除',
            description: '您可以重新上傳圖片',
            variant: 'default',
        });
    };

    return (
        <div className={cn('space-y-2', className)}>
            {hasImage && (
                <div className="relative rounded border overflow-hidden max-w-xs">
                    <img
                        src={value!}
                        alt="封面圖片"
                        className="max-w-full h-auto object-contain"
                    />
                    <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="absolute top-0 right-0 rounded-none"
                        onClick={handleRemove}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            )}

            {!hasImage && (
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
                            <span>上傳封面圖片</span>
                        </>
                    )}
                    <UploadButton<OurFileRouter, 'serverImage'>
                        endpoint="serverImage"
                        onClientUploadComplete={handleUpload}
                        onUploadBegin={() => setIsUploading(true)}
                        onUploadError={(err) => {
                            toast({
                                variant: 'destructive',
                                title: '圖片上傳失敗',
                                description: err.message,
                            });
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

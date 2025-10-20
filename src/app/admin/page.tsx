'use client';

import React from 'react';
import { useLoadingStore } from '@/stores/useLoadingStore';
import { useToast } from '@/hooks/use-toast';
export default function Page() {
    const { show, hide } = useLoadingStore();
    const { toast } = useToast();
    const handleClick = async () => {
        try {
            show();
            await new Promise((r) => setTimeout(r, 1500));
            toast({
                variant: 'success',
                title: '操作完成',
                description: (
                    <pre>
                        <code>
                            {JSON.stringify({
                                "marketing_emails": true,
                                "security_emails": true
                            },null,2)}
                        </code>
                    </pre>
                ),
                duration: 1500,
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: '操作失敗',
                description: '這是一個失敗的提示',
                duration: 1500,
            });
        } finally {
            hide();
        }
    };

    return (
        <main className="p-4 space-y-4">
            {/* <h1 className="text-xl font-bold">全域 Loading + Toast 測試</h1>
            <Button onClick={handleClick}>
                Click
            </Button> */}
            TEST
        </main>
    );
}

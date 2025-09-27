'use client';

import React, { useState, ChangeEvent } from 'react';
import Image from 'next/image';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { useRouter } from 'next/navigation';

import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { TextareaInput } from '@/components/TextareaInput';
import { useToast } from '@/hooks/use-toast';
import { useLoadingStore } from '@/stores/useLoadingStore';

import { TourMapSchema, type TourMapValues } from '@/schemas/tourmap';
import { replaceTourMap } from '@/app/admin/product/action/tourmap';
import FormError from '@/components/auth/FormError';
import FormSuccess from '@/components/auth/FormSuccess';

type Props = {
    productId: string;
    initialData?: TourMapValues | null;
};

export default function TourMapForm({ productId, initialData }: Props) {
    const router = useRouter();
    const { toast } = useToast();
    const { show, hide } = useLoadingStore();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>();
    const [success, setSuccess] = useState<string>();

    const form = useForm<TourMapValues>({
        resolver: zodResolver(TourMapSchema),
        mode: 'onChange',
        defaultValues: {
            productId,
            imageUrl: initialData?.imageUrl ?? '',
            content: initialData?.content ?? '',
        },
    });

    const { isSubmitting } = form.formState;

    // === 圖片上傳 ===
    const handleFileInput = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size / 1024 / 1024 > 50) {
            toast({
                variant: 'destructive',
                title: '檔案過大',
                description: '上限 50MB，請重新選擇',
            });
            return;
        }

        setIsLoading(true);
        show();
        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'content-type': file.type },
                body: file,
            });
            if (!res.ok) throw new Error('上傳失敗');
            const { url } = await res.json();

            form.setValue('imageUrl', url, { shouldValidate: true });

            toast({ title: '上傳成功', description: '已更新圖片' });
        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: err?.message ?? '上傳失敗',
            });
        } finally {
            setIsLoading(false);
            hide();
        }
    };

    // === 送出 ===
    const onSubmit: SubmitHandler<TourMapValues> = async (values) => {
        setError(undefined);
        setSuccess(undefined);

        setIsLoading(true);
        show();
        try {
            const res = await replaceTourMap(values);
            if ('error' in res) {
                setError(res.error);
                toast({ variant: 'destructive', title: res.error });
            } else {
                const msg = res.success ?? '地圖已更新';
                setSuccess(msg);
                toast({ title: msg });
                router.refresh();
            }
        } catch (err: any) {
            const msg = err?.message ?? '地圖儲存失敗';
            setError(msg);
            toast({ variant: 'destructive', title: msg });
        } finally {
            setIsLoading(false);
            hide();
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="mx-auto w-full">
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                        {/* Header */}
                        <div className="border-b border-slate-100 p-6">
                            <h2 className="text-xl font-semibold text-slate-900">
                                行程地圖設定
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                請上傳行程地圖圖片，帶 * 為必填。
                            </p>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {/* 圖片上傳 */}
                            <FormField
                                control={form.control}
                                name="imageUrl"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="after:ml-1 after:text-rose-500 after:content-['*']">
                                            圖片
                                        </FormLabel>
                                        <label
                                            htmlFor="upload-tourmap"
                                            className="group relative flex h-64 w-full cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-slate-50/60 transition hover:bg-slate-50"
                                        >
                                            <div className="absolute inset-0 z-10" />
                                            <div
                                                className={`z-[3] flex flex-col items-center justify-center px-10 text-center ${
                                                    field.value
                                                        ? 'absolute inset-0 rounded-xl bg-white/80 opacity-0 backdrop-blur-sm transition group-hover:opacity-100'
                                                        : ''
                                                }`}
                                            >
                                                <svg
                                                    className="h-7 w-7"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path d="M4 14.9A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.24" />
                                                    <path d="M12 12v9" />
                                                    <path d="m16 16-4-4-4 4" />
                                                </svg>
                                                <p className="mt-2 text-sm text-slate-500">
                                                    拖曳或點擊上傳
                                                </p>
                                            </div>
                                            {field.value ? (
                                                <Image
                                                    src={field.value}
                                                    alt="地圖圖片"
                                                    fill
                                                    className="rounded-xl object-contain bg-white"
                                                />
                                            ) : null}
                                        </label>

                                        <input
                                            id="upload-tourmap"
                                            type="file"
                                            className="hidden"
                                            onChange={handleFileInput}
                                        />

                                        <p className="text-xs text-slate-500">
                                            支援單張圖片上傳（最大 50MB）。
                                        </p>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* 地圖備註 */}
                            <FormField
                                control={form.control}
                                name="content"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>地圖備註</FormLabel>
                                        <FormControl>
                                            <TextareaInput
                                                rows={4}
                                                {...field}
                                                value={field.value ?? ''}
                                                placeholder="請輸入地圖備註"
                                                disabled={
                                                    isSubmitting || isLoading
                                                }
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* 錯誤/成功訊息 */}
                            <FormError message={error} />
                            <FormSuccess message={success} />

                            <div className="flex justify-end pt-6">
                                <Button
                                    type="submit"
                                    disabled={isSubmitting || isLoading}
                                >
                                    {isSubmitting || isLoading
                                        ? '儲存中...'
                                        : '儲存地圖'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </Form>
    );
}

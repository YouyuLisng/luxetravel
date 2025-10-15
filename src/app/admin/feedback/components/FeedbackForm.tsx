// src/app/admin/feedback/components/FeedbackForm.tsx
'use client';

import { useState, useTransition, useCallback, ChangeEvent } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FormError from '@/components/auth/FormError';
import FormSuccess from '@/components/auth/FormSuccess';

import { useToast } from '@/hooks/use-toast';
import { useLoadingStore } from '@/stores/useLoadingStore';

import {
    createFeedback,
    editFeedback,
} from '@/app/admin/feedback/action/feedback';

import { useQueryClient } from '@tanstack/react-query';
import { KEYS } from '@/features/feedback/queries/feedbackQueries';

/* ========== Zod：表單 Schema（輸入形狀）========== */
const FormSchema = z.object({
    title: z.string().min(1, '請輸入標題'),
    content: z.string().optional(),
    nickname: z.string().min(1, '請輸入暱稱'),
    linkUrl: z.string().url('請輸入正確的網址'),
    imageUrl: z.string().url('請輸入正確的圖片網址'),
    linekName: z.string().optional(),
});

type FeedbackFormValues = z.infer<typeof FormSchema>;

interface Props {
    mode?: 'create' | 'edit';
    initialData?: Partial<FeedbackFormValues> & { id?: string };
}

export default function FeedbackForm({ mode = 'create', initialData }: Props) {
    const isEdit = mode === 'edit';
    const router = useRouter();
    const { toast } = useToast();
    const { show, hide } = useLoadingStore();
    const qc = useQueryClient();

    const searchParams = useSearchParams();
    const page = searchParams.get('page') || '1';
    const pageSize = searchParams.get('pageSize') || '50';
    const q = searchParams.get('q') || '';
    const LIST_PATH = `/admin/feedback?page=${page}&pageSize=${pageSize}&q=${q}`;

    const [isPending, startTransition] = useTransition();
    const [isLoading, setIsLoading] = useState(false);
    const [imgPreview, setImgPreview] = useState(initialData?.imageUrl ?? '');
    const [error, setError] = useState<string>();
    const [success, setSuccess] = useState<string>();

    const form = useForm<FeedbackFormValues>({
        resolver: zodResolver(FormSchema),
        mode: 'onChange',
        defaultValues: {
            title: initialData?.title ?? '',
            content: initialData?.content ?? '',
            nickname: initialData?.nickname ?? '',
            linkUrl: initialData?.linkUrl ?? '',
            imageUrl: initialData?.imageUrl ?? '',
            linekName: initialData?.linekName ?? '',
        },
    });

    const { isValid, isSubmitting } = form.formState;

    const headingTitle = isEdit ? '編輯旅客迴響' : '新增旅客迴響';
    const headingDesc = isEdit
        ? '修改此旅客迴響 並儲存。帶 * 為必填。'
        : '請填寫標題、暱稱、連結、並上傳圖片。帶 * 為必填。';
    const formId = 'feedback-form';

    // 上傳圖片
    const handleImageUpload = useCallback(
        async (file: File) => {
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
                const previewUrl = URL.createObjectURL(file);
                setImgPreview(previewUrl);

                toast({
                    title: '上傳成功',
                    description: '已更新圖片預覽',
                    duration: 1500,
                });
            } catch (err: any) {
                toast({
                    variant: 'destructive',
                    title: err?.message ?? '上傳失敗',
                    duration: 1800,
                });
            } finally {
                setIsLoading(false);
                hide();
            }
        },
        [form, show, hide, toast]
    );

    const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size / 1024 / 1024 > 50) {
            toast({
                variant: 'destructive',
                title: '檔案過大',
                description: '上限 50MB，請重新選擇',
                duration: 1800,
            });
            return;
        }
        handleImageUpload(file);
    };

    const onSubmit: SubmitHandler<FeedbackFormValues> = (values) => {
        setError(undefined);
        setSuccess(undefined);

        startTransition(async () => {
            setIsLoading(true);
            show();
            try {
                let res: { error?: string; success?: string } | undefined;

                const payload = {
                    title: values.title.trim(),
                    content: values.content?.trim() || undefined,
                    nickname: values.nickname.trim(),
                    imageUrl: values.imageUrl.trim(),
                    linkUrl: values.linkUrl.trim(),
                    linekName: values.linekName?.trim() || undefined,
                };

                if (isEdit) {
                    const id = initialData?.id;
                    if (!id) {
                        setError('缺少編輯目標 ID');
                        setIsLoading(false);
                        hide();
                        return;
                    }
                    res = await editFeedback(id, payload as any);
                    if (!res?.error) {
                        await Promise.all([
                            qc.invalidateQueries({ queryKey: ['feedbacks'] }),
                            qc.invalidateQueries({ queryKey: KEYS.detail(id) }),
                        ]);
                    }
                } else {
                    res = await createFeedback(payload as any);
                    if (!res?.error) {
                        await qc.invalidateQueries({ queryKey: ['feedbacks'] });
                    }
                }

                if (res?.error) {
                    setError(res.error);
                } else {
                    setSuccess(
                        res?.success ?? (isEdit ? '更新成功' : '新增成功')
                    );
                    router.replace(LIST_PATH);
                }
            } catch (e: any) {
                setError(
                    e?.response?.data?.message ||
                        e?.message ||
                        (isEdit
                            ? '更新失敗，請稍後再試'
                            : '新增失敗，請稍後再試')
                );
            } finally {
                setIsLoading(false);
                hide();
            }
        });
    };

    return (
        <Form {...form}>
            <div className="mx-auto w-full">
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {/* Header */}
                    <div className="border-b border-slate-100 p-6">
                        <h2 className="text-xl font-semibold text-slate-900">
                            {headingTitle}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            {headingDesc}
                        </p>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <form
                            id={formId}
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-8"
                        >
                            <div className="grid grid-cols-1 gap-6">
                                {/* 標題 */}
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="after:ml-1 after:text-rose-500 after:content-['*']">
                                                標題
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="例：北海道旅客回饋"
                                                    disabled={
                                                        isPending ||
                                                        isLoading ||
                                                        isSubmitting
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* 內容 */}
                                <FormField
                                    control={form.control}
                                    name="content"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>內容（選填）</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="可簡單描述回饋重點"
                                                    disabled={
                                                        isPending ||
                                                        isLoading ||
                                                        isSubmitting
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* 暱稱 */}
                                <FormField
                                    control={form.control}
                                    name="nickname"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="after:ml-1 after:text-rose-500 after:content-['*']">
                                                暱稱
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="例：Yuki"
                                                    disabled={
                                                        isPending ||
                                                        isLoading ||
                                                        isSubmitting
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* 連結 */}
                                <FormField
                                    control={form.control}
                                    name="linkUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="after:ml-1 after:text-rose-500 after:content-['*']">
                                                連結
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    inputMode="url"
                                                    placeholder="https://example.com/feedback/xxx"
                                                    disabled={
                                                        isPending ||
                                                        isLoading ||
                                                        isSubmitting
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* 圖片上傳 */}
                            <div className="space-y-2">
                                <FormField
                                    control={form.control}
                                    name="imageUrl"
                                    render={() => (
                                        <FormItem>
                                            <FormLabel className="after:ml-1 after:text-rose-500 after:content-['*']">
                                                圖片
                                            </FormLabel>

                                            <label
                                                htmlFor="upload-feedback"
                                                className="group relative flex h-64 w-full cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-slate-50/60 transition hover:bg-slate-50"
                                            >
                                                <div className="absolute inset-0 z-10" />
                                                <div
                                                    className={`z-[3] flex flex-col items-center justify-center px-10 text-center ${
                                                        imgPreview
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

                                                {imgPreview ? (
                                                    <Image
                                                        src={imgPreview}
                                                        alt="預覽圖片"
                                                        fill
                                                        className="rounded-xl object-contain bg-white"
                                                    />
                                                ) : null}
                                            </label>

                                            <input
                                                id="upload-feedback"
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
                            </div>

                            <FormError message={error} />
                            <FormSuccess message={success} />
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="rounded-b-2xl border-t border-slate-100 bg-slate-50/60 p-4">
                        <div className="flex items-center justify-end gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                disabled={
                                    isLoading || isPending || isSubmitting
                                }
                            >
                                取消
                            </Button>
                            <Button
                                type="submit"
                                form={formId}
                                disabled={
                                    !isValid ||
                                    isLoading ||
                                    isPending ||
                                    isSubmitting
                                }
                            >
                                {isEdit ? '儲存變更' : '新增旅客迴響'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </Form>
    );
}

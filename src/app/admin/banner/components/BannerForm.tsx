'use client';

import React, {
    ChangeEvent,
    useCallback,
    useState,
    useTransition,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SubmitHandler, useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

import { useLoadingStore } from '@/stores/useLoadingStore';
import { useToast } from '@/hooks/use-toast';

import FormError from '@/components/auth/FormError';
import FormSuccess from '@/components/auth/FormSuccess';

import { BannerCreateSchema, type BannerCreateValues } from '@/schemas/banner';
import { createBanner, editBanner } from '@/app/admin/banner/action/banner';
import { useQueryClient } from '@tanstack/react-query';
import { KEYS } from '@/features/banner/queries/bannerQueries';

// ✅ 統一表單型別（避免 union 造成 resolver/Control 不相容）
type BannerFormValues = BannerCreateValues;

interface Props {
    initialData?: Partial<BannerFormValues> & { id?: string };
    method?: 'POST' | 'PUT';
}

export default function BannerForm({ initialData, method = 'POST' }: Props) {
    const router = useRouter();
    const { show, hide } = useLoadingStore();
    const { toast } = useToast();
    const qc = useQueryClient();
    
    const searchParams = useSearchParams();
    const page = searchParams.get('page') || '1';
    const pageSize = searchParams.get('pageSize') || '50';
    const q = searchParams.get('q') || '';
    const LIST_PATH = `/admin/banner?page=${page}&pageSize=${pageSize}&q=${q}`;

    const [imgPreview, setImgPreview] = useState(initialData?.imageUrl ?? '');
    const [isLoading, setIsLoading] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string>();
    const [success, setSuccess] = useState<string>();

    const isEdit = method === 'PUT' || Boolean(initialData?.id);
    const headingTitle = isEdit ? '編輯首頁輪播大圖' : '新增首頁輪播大圖';
    const headingDesc = '請填寫相關資料。帶 * 為必填。';

    const form = useForm<BannerFormValues>({
        resolver: zodResolver(BannerCreateSchema) as any,
        mode: 'onChange', // ✅ 即時驗證
        defaultValues: {
            title: initialData?.title ?? '',
            subtitle: (initialData?.subtitle as string | null) ?? null,
            linkText: (initialData?.linkText as string | null) ?? null,
            linkUrl: (initialData?.linkUrl as string | null) ?? null,
            imageUrl: initialData?.imageUrl ?? '',
            order:
                typeof initialData?.order === 'number'
                    ? (initialData.order as number)
                    : 0,
        },
    });
    const { isValid, isSubmitting } = form.formState;

    // 將空字串正規化為 null
    function normalize(values: BannerFormValues): BannerFormValues {
        return {
            ...values,
            subtitle: values.subtitle === '' ? null : (values.subtitle ?? null),
            linkText: values.linkText === '' ? null : (values.linkText ?? null),
            linkUrl: values.linkUrl === '' ? null : (values.linkUrl ?? null),
            order: typeof values.order === 'number' ? values.order : 0,
        };
    }

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

    const onSubmit: SubmitHandler<BannerFormValues> = (values) => {
        setError(undefined);
        setSuccess(undefined);

        startTransition(async () => {
            setIsLoading(true);
            show();
            try {
                const payload = normalize(values);

                if (!payload.imageUrl) {
                    toast({
                        variant: 'destructive',
                        title: '請先上傳圖片',
                        duration: 1600,
                    });
                    return;
                }

                let res: { error?: string; success?: string } | undefined;

                if (isEdit) {
                    const id = initialData?.id;
                    if (!id) {
                        setError('缺少編輯目標 ID');
                        return;
                    }
                    res = await editBanner(id, payload as any);
                } else {
                    res = await createBanner(payload);
                }

                if (res?.error) {
                    setError(res.error);
                } else {
                    setSuccess(
                        res?.success ?? (isEdit ? '更新成功' : '新增成功')
                    );

                    await qc.invalidateQueries({ queryKey: ['banners'] });
                    if (isEdit && initialData?.id) {
                        await qc.invalidateQueries({
                            queryKey: KEYS.detail(initialData.id),
                        });
                    }

                    router.replace(LIST_PATH);
                }
            } catch (err: any) {
                setError(err?.message ?? (isEdit ? '更新失敗' : '新增失敗'));
            } finally {
                setIsLoading(false);
                hide();
            }
        });
    };

    const formId = 'banner-form';

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
                                                <div>
                                                    <Input
                                                        {...field}
                                                        placeholder="例：夏季精選優惠"
                                                        maxLength={10} // ✅ 前端輸入限制
                                                        disabled={
                                                            isPending ||
                                                            isLoading ||
                                                            isSubmitting
                                                        }
                                                    />
                                                    <p className="text-xs text-gray-400 mt-1 text-right">
                                                        {field.value?.length ??
                                                            0}{' '}
                                                        / 10
                                                    </p>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* 副標題 */}
                                <FormField
                                    control={form.control}
                                    name="subtitle"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                副標題（選填）
                                            </FormLabel>
                                            <FormControl>
                                                <div>
                                                    <Input
                                                        {...field}
                                                        value={
                                                            field.value ?? ''
                                                        }
                                                        onChange={(e) =>
                                                            field.onChange(
                                                                e.target
                                                                    .value ||
                                                                    null
                                                            )
                                                        }
                                                        placeholder="例：日本自由行限時折扣"
                                                        maxLength={30} // ✅ 前端輸入限制
                                                        disabled={
                                                            isPending ||
                                                            isLoading ||
                                                            isSubmitting
                                                        }
                                                    />
                                                    <p className="text-xs text-gray-400 mt-1 text-right">
                                                        {field.value?.length ??
                                                            0}{' '}
                                                        / 30
                                                    </p>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* 連結文字 */}
                                <FormField
                                    control={form.control}
                                    name="linkText"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                連結文字（選填）
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    value={field.value ?? ''}
                                                    onChange={(e) =>
                                                        field.onChange(
                                                            e.target.value ||
                                                                null
                                                        )
                                                    }
                                                    placeholder="例：立即查看"
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

                                {/* 連結網址 */}
                                <FormField
                                    control={form.control}
                                    name="linkUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                連結網址（選填）
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    inputMode="url"
                                                    value={field.value ?? ''}
                                                    onChange={(e) =>
                                                        field.onChange(
                                                            e.target.value ||
                                                                null
                                                        )
                                                    }
                                                    placeholder="https://www.example.com/xxx"
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

                                {/* 排序 */}
                                <FormField
                                    control={form.control}
                                    name="order"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="after:ml-1 after:text-rose-500 after:content-['*']">
                                                排序
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    value={field.value ?? 0}
                                                    onChange={(e) =>
                                                        field.onChange(
                                                            Number(
                                                                e.target.value
                                                            )
                                                        )
                                                    }
                                                    placeholder="0"
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

                                {/* 右側空白 */}
                                <div className="hidden md:block" />
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
                                                htmlFor="upload-banner"
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
                                                id="upload-banner"
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
                                // ✅ 需通過表單驗證才可送出
                                disabled={
                                    !isValid ||
                                    isLoading ||
                                    isPending ||
                                    isSubmitting
                                }
                            >
                                {isEdit ? '儲存變更' : '送出需求'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </Form>
    );
}

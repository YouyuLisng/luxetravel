'use client';

import { useState, useTransition, useCallback, ChangeEvent } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import AsyncSelect from 'react-select/async';

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import CreatableMultiSelect from '@/components/CreatableMultiSelect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FormError from '@/components/auth/FormError';
import FormSuccess from '@/components/auth/FormSuccess';
import { TextareaInput } from '@/components/TextareaInput';

import { useToast } from '@/hooks/use-toast';
import { useLoadingStore } from '@/stores/useLoadingStore';
import { useQueryClient } from '@tanstack/react-query';
import { createPage, editPage } from '@/app/admin/page/action/index';
import { KEYS } from '@/features/page/queries/pageQueries';

/* ========= Page Schema ========= */
const FormSchema = z.object({
    title: z.string().trim().min(1, '請輸入標題'),
    slug: z
        .string()
        .trim()
        .min(1, '請輸入 Slug')
        .regex(/^[a-z0-9-]+$/, 'Slug 僅能包含小寫英文、數字與 -'),
    content: z.string().optional(),
    seoTitle: z.string().optional(),
    seoDesc: z.string().optional(),
    seoImage: z.string().url('請輸入正確的圖片網址').optional().nullable(),
    keywords: z.array(z.string()).default([]),
    tourProducts: z.array(z.string()).default([]), // ⬅️ 新增關聯產品
});

// ❗ 用 input 型別，讓 RHF 可以接受 `undefined`
type PageFormValues = z.input<typeof FormSchema>;

interface Props {
    mode?: 'create' | 'edit';
    initialData?: Partial<PageFormValues> & { id?: string };
}

type Option = { value: string; label: string };

export default function PageForm({ mode = 'create', initialData }: Props) {
    const isEdit = mode === 'edit';
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const { show, hide } = useLoadingStore();
    const qc = useQueryClient();

    const page = searchParams.get('page') || '1';
    const pageSize = searchParams.get('pageSize') || '50';
    const q = searchParams.get('q') || '';
    const LIST_PATH = `/admin/page?page=${page}&pageSize=${pageSize}&q=${q}`;

    const [isPending, startTransition] = useTransition();
    const [isLoading, setIsLoading] = useState(false);
    const [imgPreview, setImgPreview] = useState(initialData?.seoImage ?? '');
    const [error, setError] = useState<string>();
    const [success, setSuccess] = useState<string>();

    const form = useForm<PageFormValues>({
        resolver: zodResolver(FormSchema),
        mode: 'onChange',
        defaultValues: {
            title: initialData?.title ?? '',
            slug: initialData?.slug ?? '',
            content: initialData?.content ?? '',
            seoTitle: initialData?.seoTitle ?? '',
            seoDesc: initialData?.seoDesc ?? '',
            seoImage: initialData?.seoImage ?? null,
            keywords: initialData?.keywords ?? [],
            tourProducts: initialData?.tourProducts ?? [],
        },
    });

    const { isValid, isSubmitting } = form.formState;

    const headingTitle = isEdit ? '編輯 Page' : '新增 Page';
    const formId = 'page-form';

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

                form.setValue('seoImage', url, { shouldValidate: true });
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

    const loadTourProducts = async (inputValue: string): Promise<Option[]> => {
        if (!inputValue) return [];
        const res = await fetch(
            `/api/admin/product/search?q=${encodeURIComponent(inputValue)}`
        );
        if (!res.ok) return [];
        const data = await res.json();
        return data.rows.map((t: any) => ({
            value: t.id,
            label: `${t.code} - ${t.name}`,
            code: t.code,
        }));
    };

    const onSubmit: SubmitHandler<PageFormValues> = (values) => {
        setError(undefined);
        setSuccess(undefined);

        startTransition(async () => {
            setIsLoading(true);
            show();
            try {
                const payload = {
                    ...values,
                    keywords: values.keywords ?? [],
                    tourProducts: values.tourProducts ?? [],
                };

                let res: { error?: string; success?: string } | undefined;

                if (isEdit) {
                    const id = initialData?.id;
                    if (!id) {
                        setError('缺少編輯目標 ID');
                        setIsLoading(false);
                        hide();
                        return;
                    }

                    res = await editPage(id, payload, payload.tourProducts);
                    if (!res?.error) {
                        await Promise.all([
                            qc.invalidateQueries({ queryKey: ['pages'] }),
                            qc.invalidateQueries({
                                queryKey: KEYS.detail(id!),
                            }),
                        ]);
                    }
                } else {
                    res = await createPage(payload, payload.tourProducts);
                    if (!res?.error) {
                        await qc.invalidateQueries({ queryKey: ['pages'] });
                    }
                }

                if (res?.error) {
                    setError(res.error);
                } else {
                    setSuccess(
                        res?.success ?? (isEdit ? '更新成功' : '新增成功')
                    );
                    router.replace(LIST_PATH);
                    router.refresh();
                }
            } catch (e: any) {
                setError(
                    e?.response?.data?.message ||
                        e?.message ||
                        (isEdit ? '更新失敗' : '新增失敗')
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
                            請填寫相關資料。帶 * 為必填。
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
                                {/* Title */}
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
                                                    placeholder="請輸入標題"
                                                    value={field.value ?? ''}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Slug */}
                                <FormField
                                    control={form.control}
                                    name="slug"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="after:ml-1 after:text-rose-500 after:content-['*']">
                                                Slug
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="例如 japan-ski"
                                                    value={field.value ?? ''}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Keywords */}
                                <FormField
                                    control={form.control}
                                    name="keywords"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>關鍵字</FormLabel>
                                            <FormControl>
                                                <CreatableMultiSelect
                                                    value={field.value ?? []}
                                                    onChange={field.onChange}
                                                    options={[]}
                                                    placeholder="輸入或選擇關鍵字"
                                                    instanceId="page-keywords"
                                                    creatable
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* TourProducts */}
                                <FormField
                                    control={form.control}
                                    name="tourProducts"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>關聯行程</FormLabel>
                                            <FormControl>
                                                <AsyncSelect
                                                    instanceId="tour-products-select"
                                                    inputId="tour-products-input"
                                                    name="tour-products"
                                                    isMulti
                                                    cacheOptions
                                                    defaultOptions
                                                    loadOptions={
                                                        loadTourProducts
                                                    }
                                                    closeMenuOnSelect={false}
                                                    value={(
                                                        field.value ?? []
                                                    ).map((id) => ({
                                                        value: id,
                                                        label: id,
                                                    }))}
                                                    onChange={(selected) =>
                                                        field.onChange(
                                                            (
                                                                selected as Option[]
                                                            ).map(
                                                                (opt) =>
                                                                    opt.value
                                                            )
                                                        )
                                                    }
                                                    placeholder="搜尋並選擇行程"
                                                    getOptionLabel={(
                                                        option: any
                                                    ) => option.label}
                                                    getOptionValue={(
                                                        option: any
                                                    ) => option.value}
                                                    formatOptionLabel={(
                                                        option: any,
                                                        { context }
                                                    ) =>
                                                        context === 'value'
                                                            ? option.code ||
                                                              option.label
                                                            : option.label
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {/* Content */}
                                <FormField
                                    control={form.control}
                                    name="content"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>內容</FormLabel>
                                            <FormControl>
                                                <TextareaInput
                                                    {...field}
                                                    rows={4}
                                                    value={field.value ?? ''}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {/* SEO Title */}
                                <FormField
                                    control={form.control}
                                    name="seoTitle"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>SEO 標題</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="SEO 標題"
                                                    value={field.value ?? ''}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* SEO Desc */}
                                <FormField
                                    control={form.control}
                                    name="seoDesc"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>SEO 描述</FormLabel>
                                            <FormControl>
                                                <TextareaInput
                                                    {...field}
                                                    rows={3}
                                                    value={field.value ?? ''}
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
                                    name="seoImage"
                                    render={() => (
                                        <FormItem>
                                            <FormLabel>
                                                SEO 圖片（選填）
                                            </FormLabel>

                                            <label
                                                htmlFor="upload-page"
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
                                                id="upload-page"
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
                                {isEdit ? '儲存變更' : '送出需求'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </Form>
    );
}

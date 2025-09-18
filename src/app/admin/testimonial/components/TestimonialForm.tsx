// app/(admin)/admin/testimonial/components/TestimonialForm.tsx
'use client';

import React, {
    useTransition,
    useState,
    useCallback,
    ChangeEvent,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
    Form,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
    FormField,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import FormError from '@/components/auth/FormError';
import FormSuccess from '@/components/auth/FormSuccess';
import Image from 'next/image';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select';

import { useToast } from '@/hooks/use-toast';
import { useLoadingStore } from '@/stores/useLoadingStore';
import { useQueryClient } from '@tanstack/react-query';
import { KEYS } from '@/features/testimonial/queries/testimonialQueries';
import {
    createTestimonial,
    editTestimonial,
} from '@/app/admin/testimonial/action/testimonial';
import { TextareaInput } from '@/components/TextareaInput';

/* -------------------- Zod form schema (client) -------------------- */
const FormSchema = z.object({
    mode: z.enum(['REAL', 'MARKETING'], { required_error: '請選擇來源類型' }),
    nickname: z.string().trim().optional().nullable(),
    stars: z
        .preprocess(
            (v) =>
                v === '' || v === null || v === undefined ? null : Number(v),
            z
                .number()
                .int()
                .min(1, '最少 1 顆星')
                .max(5, '最多 5 顆星')
                .nullable()
        )
        .optional(),
    content: z.string().trim().min(1, '請輸入內容'),
    linkUrl: z.string().trim().url('請輸入正確的網址').optional().nullable(),
    order: z.preprocess(
        (v) => (v === '' || v === null || v === undefined ? 0 : Number(v)),
        z.number().int().min(0, '排序不可小於 0')
    ),
    imageUrl: z.string().url('請上傳正確的圖片網址').optional().nullable(),
});

type TestimonialFormValues = z.infer<typeof FormSchema>;

interface Props {
    initialData?: Partial<TestimonialFormValues> & { id?: string };
    method?: 'POST' | 'PUT';
}

export default function TestimonialForm({
    initialData,
    method = 'POST',
}: Props) {
    const isEdit = method === 'PUT' || Boolean(initialData?.id);
    console.log(initialData);
    const router = useRouter();
    const { toast } = useToast();
    const { show, hide } = useLoadingStore();
    const qc = useQueryClient();

    const searchParams = useSearchParams();
    const page = searchParams.get('page') || '1';
    const pageSize = searchParams.get('pageSize') || '50';
    const q = searchParams.get('q') || '';
    const LIST_PATH = `/admin/testimonial?page=${page}&pageSize=${pageSize}&q=${q}`;

    const [imgPreview, setImgPreview] = useState(initialData?.imageUrl ?? '');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>();
    const [success, setSuccess] = useState<string>();
    const [isPending, startTransition] = useTransition();

    const form = useForm<TestimonialFormValues>({
        resolver: zodResolver(FormSchema) as any,
        mode: 'onChange',
        defaultValues: {
            mode: (initialData?.mode as 'REAL' | 'MARKETING') ?? 'REAL',
            nickname: initialData?.nickname ?? '',
            stars:
                initialData?.stars === undefined || initialData?.stars === null
                    ? null
                    : Number(initialData.stars),
            content: initialData?.content ?? '',
            linkUrl: (initialData?.linkUrl as string | null) ?? null,
            order:
                typeof initialData?.order === 'number'
                    ? (initialData.order as number)
                    : 0,
        },
    });

    const { isValid, isSubmitting } = form.formState;

    // 將空字串正規化成 null，符合 Server Action 預期
    function normalize(v: TestimonialFormValues) {
        return {
            mode: v.mode,
            content: v.content,
            order: typeof v.order === 'number' ? v.order : 0,
            nickname: v.nickname ? v.nickname : null,
            stars: v.stars ?? null,
            linkUrl: v.linkUrl ? v.linkUrl : null,
            imageUrl: v.imageUrl ? v.imageUrl : null,
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

    const onSubmit: SubmitHandler<TestimonialFormValues> = (values) => {
        setError(undefined);
        setSuccess(undefined);

        startTransition(async () => {
            show();
            try {
                const payload = normalize(values);
                let res:
                    | { error?: string; success?: string; data?: unknown }
                    | undefined;

                if (isEdit) {
                    const id = initialData?.id;
                    if (!id) {
                        setError('缺少編輯目標 ID');
                        hide();
                        return;
                    }
                    res = await editTestimonial(id, payload);
                } else {
                    res = await createTestimonial(payload);
                }

                if (res?.error) {
                    setError(res.error);
                } else {
                    setSuccess(
                        res?.success ?? (isEdit ? '更新成功' : '新增成功')
                    );

                    // 失效快取 → 返回列表
                    await qc.invalidateQueries({ queryKey: ['testimonials'] });
                    if (isEdit && initialData?.id) {
                        await qc.invalidateQueries({
                            queryKey: KEYS.detail(initialData.id),
                        });
                    }
                    router.replace(LIST_PATH);
                }
            } catch (e: any) {
                setError(e?.message ?? (isEdit ? '更新失敗' : '新增失敗'));
            } finally {
                hide();
            }
        });
    };

    const formId = 'testimonial-form';

    return (
        <Form {...form}>
            <div className="mx-auto w-full">
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {/* Header */}
                    <div className="border-b border-slate-100 p-6">
                        <h2 className="text-xl font-semibold text-slate-900">
                            {isEdit ? '編輯 Testimonial' : '新增 Testimonial'}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            {isEdit
                                ? '修改此評價內容並儲存。帶 * 為必填。'
                                : '請填寫評價內容與相關資訊。帶 * 為必填。'}
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
                                {/* 來源類型 */}
                                <FormField
                                    control={form.control}
                                    name="mode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="after:ml-1 after:text-rose-500 after:content-['*']">
                                                來源類型
                                            </FormLabel>
                                            <FormControl>
                                                <Select
                                                    value={field.value}
                                                    onValueChange={(v) =>
                                                        field.onChange(
                                                            v as
                                                                | 'REAL'
                                                                | 'MARKETING'
                                                        )
                                                    }
                                                    disabled={
                                                        isPending ||
                                                        isSubmitting
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="請選擇" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="REAL">
                                                            REAL（真實旅客）
                                                        </SelectItem>
                                                        <SelectItem value="MARKETING">
                                                            MARKETING（行銷文案）
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* 暱稱（選填） */}
                                <FormField
                                    control={form.control}
                                    name="nickname"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>暱稱（選填）</FormLabel>
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
                                                    placeholder="例：小明"
                                                    disabled={
                                                        isPending ||
                                                        isSubmitting
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* 星等（選填 1~5） */}
                                <FormField
                                    control={form.control}
                                    name="stars"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                星等（選填，1~5）
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    max={5}
                                                    value={field.value ?? ''}
                                                    onChange={(e) => {
                                                        const v =
                                                            e.target.value;
                                                        field.onChange(
                                                            v === ''
                                                                ? null
                                                                : Number(v)
                                                        );
                                                    }}
                                                    placeholder="1 ~ 5"
                                                    disabled={
                                                        isPending ||
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
                                            <FormLabel className="after:ml-1 after:text-rose-500 after:content-['*']">
                                                內容
                                            </FormLabel>
                                            <FormControl>
                                                <TextareaInput
                                                    rows={4}
                                                    {...field}
                                                    value={field.value ?? ''}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* 連結（選填） */}
                                <FormField
                                    control={form.control}
                                    name="linkUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>連結（選填）</FormLabel>
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
                                                    placeholder="https://example.com/post/xxx"
                                                    disabled={
                                                        isPending ||
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
                                disabled={isPending || isSubmitting}
                            >
                                取消
                            </Button>
                            <Button
                                type="submit"
                                form={formId}
                                disabled={!isValid || isPending || isSubmitting}
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

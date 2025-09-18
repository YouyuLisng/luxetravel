'use client';

import { ChangeEvent, useCallback, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
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

import {
    TravelAdvantageCreateSchema,
    TravelAdvantageEditSchema,
    type TravelAdvantageCreateValues,
    type TravelAdvantageEditValues,
} from '@/schemas/travelAdvantage';

import { useQueryClient } from '@tanstack/react-query';
import { KEYS } from '@/features/travelAdvantage/queries/travelAdvantageQuery';
import {
    createTravelAdvantage,
    editTravelAdvantage,
} from '@/app/admin/advantage/action/travelAdvantage';
import { useLoadingStore } from '@/stores/useLoadingStore';
import { useToast } from '@/hooks/use-toast';

/* ========================= 常數 ========================= */
const FIXED_MODULE_ID = '68b04a89eb0b7404083d887a';

/* ========================= Client 端統一 Schema ========================= */
const ClientSchema = z.object({
    imageUrl: z.string().min(1, '請上傳或貼上圖片 URL'),
    title: z.string().min(1, '標題必填'),
    content: z.string().min(1, '內容必填'),
    order: z.number({ invalid_type_error: '排序需為數字' }).int().nonnegative(),
});
type TravelAdvantageFormValues = z.infer<typeof ClientSchema> & {
    moduleId?: string; // 前端固定帶入
};

interface Props {
    mode?: 'create' | 'edit';
    initialData?: Partial<TravelAdvantageFormValues> & { id?: string };
}

export default function TravelAdvantageForm({
    mode = 'create',
    initialData,
}: Props) {
    const isEdit = mode === 'edit';
    const router = useRouter();
    const qc = useQueryClient();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>();
    const [success, setSuccess] = useState<string>();

    const page = searchParams.get('page') || '1';
    const pageSize = searchParams.get('pageSize') || '50';
    const q = searchParams.get('q') || '';
    const LIST_PATH = `/admin/advantage?page=${page}&pageSize=${pageSize}&q=${q}`;

    const { show, hide } = useLoadingStore();
    const { toast } = useToast();

    const [imgPreview, setImgPreview] = useState(initialData?.imageUrl ?? '');

    const form = useForm<TravelAdvantageFormValues>({
        resolver: zodResolver(ClientSchema),
        mode: 'onChange',
        defaultValues: {
            moduleId: FIXED_MODULE_ID,
            imageUrl: initialData?.imageUrl ?? '',
            title: initialData?.title ?? '',
            content: initialData?.content ?? '',
            order:
                typeof initialData?.order === 'number' ? initialData.order : 0,
        },
    });
    const { isValid, isSubmitting } = form.formState;

    const formId = 'travel-advantage-upsert-form';
    const headingTitle = isEdit ? '編輯 典藏優勢卡片' : '新增 典藏優勢卡片';
    const headingDesc = '請填寫相關資料。帶 * 為必填。';

    // 正規化：固定 moduleId、trim 字串、order 數字化
    const normalize = (
        v: TravelAdvantageFormValues
    ): TravelAdvantageFormValues => ({
        ...v,
        moduleId: FIXED_MODULE_ID,
        imageUrl: v.imageUrl?.trim(),
        title: v.title?.trim(),
        content: v.content?.trim(),
        order: typeof v.order === 'number' ? v.order : Number(v.order || 0),
    });

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

    const onSubmit = (values: TravelAdvantageFormValues) => {
        setError(undefined);
        setSuccess(undefined);

        startTransition(async () => {
            setIsLoading(true);
            try {
                const payload = normalize(values);

                let res: { error?: string; success?: string } | undefined;

                if (isEdit) {
                    const id = initialData?.id;
                    if (!id) {
                        setError('缺少編輯目標 ID');
                        setIsLoading(false);
                        return;
                    }
                    // 伺服器仍用 server schema 驗證
                    res = await editTravelAdvantage(id, {
                        imageUrl: payload.imageUrl,
                        title: payload.title,
                        content: payload.content,
                        order: payload.order,
                    } as TravelAdvantageEditValues);
                } else {
                    res = await createTravelAdvantage({
                        moduleId: FIXED_MODULE_ID,
                        imageUrl: payload.imageUrl,
                        title: payload.title,
                        content: payload.content,
                        order: payload.order,
                    } as TravelAdvantageCreateValues);
                }

                if (res?.error) {
                    setError(res.error);
                } else {
                    setSuccess(
                        res?.success ?? (isEdit ? '更新成功' : '新增成功')
                    );

                    // 失效列表與（編輯時）明細
                    await qc.invalidateQueries({
                        queryKey: ['travel-advantages'],
                    });
                    if (isEdit && initialData?.id) {
                        await qc.invalidateQueries({
                            queryKey: KEYS.detail(initialData.id),
                        });
                    }

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
                                {/* title */}
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

                                {/* content */}
                                <FormField
                                    control={form.control}
                                    name="content"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="after:ml-1 after:text-rose-500 after:content-['*']">
                                                內容
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="請輸入內容"
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

                                {/* order */}
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
                                                    min={0}
                                                    step={1}
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
                                                    htmlFor="upload-advantage"
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
                                                    id="upload-advantage"
                                                    type="file"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file =
                                                            e.target.files?.[0];
                                                        if (!file) return;
                                                        if (
                                                            file.size /
                                                                1024 /
                                                                1024 >
                                                            50
                                                        ) {
                                                            toast({
                                                                variant:
                                                                    'destructive',
                                                                title: '檔案過大',
                                                                description:
                                                                    '上限 50MB，請重新選擇',
                                                                duration: 1800,
                                                            });
                                                            return;
                                                        }
                                                        handleImageUpload(file);
                                                    }}
                                                />

                                                <p className="text-xs text-slate-500">
                                                    支援單張圖片上傳（最大
                                                    50MB）。
                                                </p>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
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

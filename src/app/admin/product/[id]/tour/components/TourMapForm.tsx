'use client';

import {
    useState,
    useTransition,
    useCallback,
    ChangeEvent,
    useEffect,
} from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
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
import { TextareaInput } from '@/components/TextareaInput';
import FormError from '@/components/auth/FormError';
import FormSuccess from '@/components/auth/FormSuccess';

import { useToast } from '@/hooks/use-toast';
import { useLoadingStore } from '@/stores/useLoadingStore';

import {
    createTourMaps,
    editTourMaps,
} from '@/app/admin/product/action/tourmap';

// ======== Schema ========
const FormSchema = z.object({
    productId: z.string().min(1, '缺少產品 ID'),
    imageUrl: z.string().url('請輸入正確的圖片網址'),
    content: z.string().optional().nullable(),
});

// ======== 型別 ========
export type TourMapFormValues = z.input<typeof FormSchema>;

interface Props {
    productId: string;
    method?: 'POST' | 'PUT'; // 👈 新增
    initialData?: Partial<TourMapFormValues> & { id?: string };
    onChange?: (values: TourMapFormValues) => void; // 👈 新增
}

export default function TourMapForm({
    productId,
    method = 'POST',
    initialData,
    onChange,
}: Props) {
    const isEdit = method === 'PUT' || initialData?.id !== undefined;
    const router = useRouter();
    const { toast } = useToast();
    const { show, hide } = useLoadingStore();

    const [isPending, startTransition] = useTransition();
    const [isLoading, setIsLoading] = useState(false);
    const [imgPreview, setImgPreview] = useState(initialData?.imageUrl ?? '');
    const [error, setError] = useState<string>();
    const [success, setSuccess] = useState<string>();

    const form = useForm<TourMapFormValues>({
        resolver: zodResolver(FormSchema),
        mode: 'onChange',
        defaultValues: {
            productId,
            imageUrl: initialData?.imageUrl ?? '',
            content: initialData?.content ?? '',
        },
    });

    const { isValid, isSubmitting } = form.formState;

    // 👇 當表單值改變時，回傳給父層
    useEffect(() => {
        const subscription = form.watch((values) => {
            onChange?.(values as TourMapFormValues);
        });
        return () => subscription.unsubscribe();
    }, [form, onChange]);

    const headingTitle = isEdit ? '編輯行程地圖' : '新增行程地圖';
    const formId = 'tourmap-form';

    // 圖片上傳
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

    const onSubmit: SubmitHandler<TourMapFormValues> = (values) => {
        setError(undefined);
        setSuccess(undefined);

        startTransition(async () => {
            setIsLoading(true);
            show();
            try {
                let res: { error?: string; success?: string } | undefined;

                if (isEdit) {
                    const id = initialData?.id;
                    if (!id) {
                        setError('缺少編輯目標 ID');
                        setIsLoading(false);
                        hide();
                        return;
                    }

                    res = await editTourMaps(id, {
                        imageUrl: values.imageUrl,
                        content: values.content ?? null,
                        productId: productId,
                    } as any);
                } else {
                    res = await createTourMaps({
                        productId,
                        imageUrl: values.imageUrl,
                        content: values.content ?? null,
                    } as any);
                }

                if (res?.error) {
                    setError(res.error);
                } else {
                    setSuccess(
                        res?.success ?? (isEdit ? '更新成功' : '新增成功')
                    );
                    router.back();
                    router.refresh();
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
                            請填寫行程地圖相關資料，帶 * 為必填。
                        </p>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <form
                            id={formId}
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-8"
                        >
                            {/* 圖片上傳 */}
                            <FormField
                                control={form.control}
                                name="imageUrl"
                                render={() => (
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

                            {/* 文字說明 */}
                            <FormField
                                control={form.control}
                                name="content"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>文字說明</FormLabel>
                                        <FormControl>
                                            <TextareaInput
                                                rows={4}
                                                {...field}
                                                value={field.value ?? ''}
                                                disabled={
                                                    isPending || isLoading
                                                }
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormError message={error} />
                            <FormSuccess message={success} />
                        </form>
                    </div>

                    {/* Footer */}
                    {/* <div className="rounded-b-2xl border-t border-slate-100 bg-slate-50/60 p-4">
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
                    </div> */}
                </div>
            </div>
        </Form>
    );
}

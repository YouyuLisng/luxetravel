'use client';

import { useState, useTransition, useCallback, ChangeEvent } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
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
import CreatableMultiSelect from '@/components/CreatableMultiSelect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import FormError from '@/components/auth/FormError';
import FormSuccess from '@/components/auth/FormSuccess';
import { Badge } from '@/components/ui/badge';
import { GoPlus, GoX } from 'react-icons/go';
import { TextareaInput } from '@/components/TextareaInput';
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from '@/components/ui/card';
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
    tourProducts: z.array(z.string()).default([]),
});

type PageFormValues = z.input<typeof FormSchema>;

type TourProductDetail = {
    id: string;
    code: string;
    name: string;
};

interface Props {
    mode?: 'create' | 'edit';
    initialData?: Partial<PageFormValues> & {
        id?: string;
        tourProductsDetail?: TourProductDetail[];
    };
}

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

    // for TourProducts
    const [productId, setProductId] = useState('');
    const [productData, setProductData] = useState<any[]>([]);
    const [addedProducts, setAddedProducts] = useState<TourProductDetail[]>(
        initialData?.tourProductsDetail ?? []
    );

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

    const headingTitle = isEdit ? '編輯活動頁面' : '新增活動頁面';
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
                setImgPreview(url);

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

    /** TourProducts Handlers **/
    const handleProductIdChange = (e: ChangeEvent<HTMLInputElement>) => {
        setProductId(e.target.value);
    };

    const onSearchProduct = async () => {
        if (!productId) return;
        setIsLoading(true);
        try {
            const res = await fetch(
                `/api/admin/product/search?q=${encodeURIComponent(productId)}`
            );
            if (!res.ok) throw new Error('搜尋失敗');
            const data = await res.json();
            setProductData(data.rows || []);
        } catch (err) {
            toast({
                variant: 'destructive',
                title: '搜尋失敗',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const onAddProduct = (product: any) => {
        const exists = addedProducts.find((p) => p.id === product.id);
        if (!exists) {
            const newList = [
                ...addedProducts,
                {
                    id: product.id,
                    code: product.code || product.GRUP_CD,
                    name: product.name || '',
                },
            ];
            setAddedProducts(newList);
            form.setValue(
                'tourProducts',
                newList.map((p) => p.id)
            );
        }
    };

    const onRemoveProduct = (product: any) => {
        const newList = addedProducts.filter((p) => p.id !== product.id);
        setAddedProducts(newList);
        form.setValue(
            'tourProducts',
            newList.map((p) => p.id)
        );
    };

    const onAddAllProducts = () => {
        const newList = [
            ...addedProducts,
            ...productData.map((p) => ({
                id: p.id,
                code: p.code || p.GRUP_CD,
                name: p.name || '',
            })),
        ];
        const uniqueList = Array.from(
            new Map(newList.map((p) => [p.id, p])).values()
        );
        setAddedProducts(uniqueList);
        form.setValue(
            'tourProducts',
            uniqueList.map((p) => p.id)
        );
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
                                                SEO標題
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
                                                網址名稱 (請輸入英文)
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder=""
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
                                            <FormLabel>SEO關鍵字</FormLabel>
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
                                            <FormLabel>SEO標題</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="SEO標題"
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
                                            <FormLabel>SEO描述</FormLabel>
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
                            <FormField
                                control={form.control}
                                name="tourProducts"
                                render={() => (
                                    <FormItem>
                                        <FormLabel>關聯行程</FormLabel>
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>產品編號</CardTitle>
                                                <CardDescription>
                                                    輸入產品編號並搜尋
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid grid-cols-[10fr,1fr,1fr] items-center gap-4">
                                                    <Input
                                                        value={productId}
                                                        onChange={
                                                            handleProductIdChange
                                                        }
                                                        type="text"
                                                        placeholder="請輸入產品編號"
                                                    />
                                                    <Button
                                                        type="button"
                                                        onClick={
                                                            onSearchProduct
                                                        }
                                                        disabled={isLoading}
                                                    >
                                                        搜尋產品
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        onClick={
                                                            onAddAllProducts
                                                        }
                                                    >
                                                        添加所有產品
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-[5fr,0.1fr,5fr] gap-4">
                                                    {/* 搜尋結果 */}
                                                    <div className="mt-4">
                                                        {productData &&
                                                            productData.length >
                                                                0 && (
                                                                <div className="grid grid-cols-5 gap-2 mt-4">
                                                                    {productData.map(
                                                                        (
                                                                            product: any,
                                                                            index: number
                                                                        ) => (
                                                                            <div
                                                                                key={
                                                                                    index
                                                                                }
                                                                                className="mb-4"
                                                                            >
                                                                                <Badge
                                                                                    variant="secondary"
                                                                                    className="px-2 py-2 mr-2 flex justify-around cursor-pointer"
                                                                                    onClick={() =>
                                                                                        onAddProduct(
                                                                                            product
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    <p className="text-sm">
                                                                                        {product.code ||
                                                                                            product.GRUP_CD}
                                                                                    </p>
                                                                                    <GoPlus className="h-5 w-5 text-orange-500" />
                                                                                </Badge>
                                                                            </div>
                                                                        )
                                                                    )}
                                                                </div>
                                                            )}
                                                    </div>
                                                    <Separator
                                                        orientation="vertical"
                                                        className="my-4 mx-auto"
                                                    />
                                                    {/* 已選產品 */}
                                                    <div className="mt-4">
                                                        <div className="grid grid-cols-5 gap-2 mt-4">
                                                            {addedProducts.map(
                                                                (
                                                                    product,
                                                                    index
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            index
                                                                        }
                                                                        className="mb-4"
                                                                    >
                                                                        <Badge
                                                                            variant="secondary"
                                                                            className="px-2 py-2 mr-2 flex justify-around cursor-pointer"
                                                                            onClick={() =>
                                                                                onRemoveProduct(
                                                                                    product
                                                                                )
                                                                            }
                                                                        >
                                                                            <p className="text-sm">
                                                                                {
                                                                                    product.code
                                                                                }
                                                                            </p>
                                                                            <GoX className="h-5 w-5 text-red-500" />
                                                                        </Badge>
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
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

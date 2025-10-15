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
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { GoPlus, GoX } from 'react-icons/go';
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from '@/components/ui/card';

import { useLoadingStore } from '@/stores/useLoadingStore';
import { useToast } from '@/hooks/use-toast';
import FormError from '@/components/auth/FormError';
import FormSuccess from '@/components/auth/FormSuccess';
import { useQueryClient } from '@tanstack/react-query';

import {
    CountryShowcaseCreateSchema,
    type CountryShowcaseCreateValues,
} from '@/schemas/countryShowcase';
import {
    createCountryShowcase,
    editCountryShowcase,
} from '@/app/admin/countryshowcases/action/countryShowcase';

type CountryShowcaseFormValues = CountryShowcaseCreateValues;

interface Props {
    initialData?: Partial<CountryShowcaseFormValues> & {
        id?: string;
        tourProductsDetail?: { id: string; code: string; name?: string }[];
    };
    method?: 'POST' | 'PUT';
}

export default function CountryShowcaseForm({
    initialData,
    method = 'POST',
}: Props) {
    const router = useRouter();
    const { show, hide } = useLoadingStore();
    const { toast } = useToast();
    const qc = useQueryClient();

    const searchParams = useSearchParams();
    const page = searchParams.get('page') || '1';
    const pageSize = searchParams.get('pageSize') || '50';
    const q = searchParams.get('q') || '';
    const LIST_PATH = `/admin/countryshowcases?page=${page}&pageSize=${pageSize}&q=${q}`;

    const [imgPreview, setImgPreview] = useState(initialData?.imageUrl ?? '');
    const [imgPreview1, setImgPreview1] = useState(
        initialData?.imageUrl1 ?? ''
    );
    const [imgPreview2, setImgPreview2] = useState(
        initialData?.imageUrl2 ?? ''
    );
    const [isLoading, setIsLoading] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string>();
    const [success, setSuccess] = useState<string>();

    // ✅ 關聯產品
    const [productId, setProductId] = useState('');
    const [productData, setProductData] = useState<any[]>([]);
    const [addedProducts, setAddedProducts] = useState<
        { id: string; code: string; name?: string }[]
    >(initialData?.tourProductsDetail ?? []);

    const isEdit = method === 'PUT' || Boolean(initialData?.id);
    const headingTitle = isEdit ? '編輯經典行程卡片' : '新增經典行程卡片';
    const headingDesc = isEdit
        ? '修改此 經典行程卡片 的內容並儲存。帶 * 為必填。'
        : '上傳圖片並填寫相關資訊。帶 * 為必填。';

    const form = useForm<CountryShowcaseFormValues>({
        resolver: zodResolver(CountryShowcaseCreateSchema) as any,
        mode: 'onChange',
        defaultValues: {
            title: initialData?.title ?? '',
            subtitle: (initialData?.subtitle as string | null) ?? null,
            description: (initialData?.description as string | null) ?? null,
            linkText: (initialData?.linkText as string | null) ?? null,
            linkUrl: (initialData?.linkUrl as string | null) ?? null,
            imageUrl: initialData?.imageUrl ?? '',
            imageUrl1: initialData?.imageUrl1 ?? null,
            imageUrl2: initialData?.imageUrl2 ?? null,
            order:
                typeof initialData?.order === 'number'
                    ? (initialData.order as number)
                    : 0,
            tourProducts:
                initialData?.tourProductsDetail?.map((p) => p.id) ?? [],
        },
    });

    const { isSubmitting } = form.formState;

    /** ===================== 資料處理 ===================== **/
    function normalize(
        values: CountryShowcaseFormValues
    ): CountryShowcaseFormValues {
        return {
            ...values,
            subtitle: values.subtitle === '' ? null : (values.subtitle ?? null),
            description:
                values.description === '' ? null : (values.description ?? null),
            linkText: values.linkText === '' ? null : (values.linkText ?? null),
            linkUrl: values.linkUrl === '' ? null : (values.linkUrl ?? null),
            order: typeof values.order === 'number' ? values.order : 0,
            tourProducts: Array.isArray(values.tourProducts)
                ? values.tourProducts
                : [],
        };
    }

    /** ===================== 圖片上傳 ===================== **/
    const handleImageUpload = useCallback(
        async (
            file: File,
            fieldName: 'imageUrl' | 'imageUrl1' | 'imageUrl2'
        ) => {
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

                form.setValue(fieldName, url, {
                    shouldValidate: true,
                    shouldDirty: true,
                });
                await form.trigger(fieldName);

                const previewUrl = URL.createObjectURL(file);
                if (fieldName === 'imageUrl') setImgPreview(previewUrl);
                if (fieldName === 'imageUrl1') setImgPreview1(previewUrl);
                if (fieldName === 'imageUrl2') setImgPreview2(previewUrl);

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

    const handleFileInput = (
        e: ChangeEvent<HTMLInputElement>,
        field: 'imageUrl' | 'imageUrl1' | 'imageUrl2'
    ) => {
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
        handleImageUpload(file, field);
    };

    /** ===================== 關聯產品搜尋 ===================== **/
    const handleProductIdChange = (e: ChangeEvent<HTMLInputElement>) => {
        setProductId(e.target.value);
    };

    const onSearchProduct = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(
                `/api/admin/product/search?q=${encodeURIComponent(productId)}`
            );
            if (!res.ok) throw new Error('搜尋失敗');
            const data = await res.json();
            setProductData(data.rows || []);
        } catch {
            toast({ variant: 'destructive', title: '搜尋失敗' });
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

    /** ===================== 送出表單 ===================== **/
    const onSubmit: SubmitHandler<CountryShowcaseFormValues> = (values) => {
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
                        title: '請先上傳主圖片',
                        duration: 1600,
                    });
                    return;
                }

                let res: { error?: string; success?: string } | undefined =
                    undefined;

                if (isEdit) {
                    const id = initialData?.id;
                    if (!id) {
                        setError('缺少編輯目標 ID');
                        return;
                    }
                    res = await editCountryShowcase(id, payload as any);
                } else {
                    res = await createCountryShowcase(payload);
                }

                if (res?.error) {
                    setError(res.error);
                } else {
                    setSuccess(res?.success ?? '操作成功');
                    await qc.invalidateQueries({
                        queryKey: ['country-showcases'],
                    });
                    router.replace(LIST_PATH);
                }
            } catch (err: any) {
                setError(err?.message ?? '操作失敗');
            } finally {
                setIsLoading(false);
                hide();
            }
        });
    };

    const formId = 'country-showcase-form';

    /** ===================== Render ===================== **/
    return (
        <Form {...form}>
            <div className="mx-auto w-full">
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 p-6">
                        <h2 className="text-xl font-semibold text-slate-900">
                            {headingTitle}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            {headingDesc}
                        </p>
                    </div>

                    <div className="p-6">
                        <form
                            id={formId}
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-8"
                        >
                            <div className="grid grid-cols-1 gap-6">
                                {/* 排序 */}
                                <FormField
                                    control={form.control}
                                    name="order"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>編號</FormLabel>
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
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* 標題 */}
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>國家名稱</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="例：日本賞楓特輯"
                                                />
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
                                            <FormLabel>國家英文名稱</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    value={field.value ?? ''}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* 描述 */}
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>描述（選填）</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    value={field.value ?? ''}
                                                />
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
                                                    value={field.value ?? ''}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* 關聯行程搜尋 */}
                                <FormField
                                    control={form.control}
                                    name="tourProducts"
                                    render={() => (
                                        <FormItem>
                                            <FormLabel>關聯行程</FormLabel>
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>
                                                        產品編號
                                                    </CardTitle>
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
                                                            {productData?.length >
                                                                0 && (
                                                                <div className="flex flex-wrap gap-2 mt-4">
                                                                    {productData.map(
                                                                        (
                                                                            product: any,
                                                                            index: number
                                                                        ) => (
                                                                            <Badge
                                                                                key={
                                                                                    index
                                                                                }
                                                                                variant="secondary"
                                                                                className="px-3 py-2 flex items-center gap-2 cursor-pointer whitespace-nowrap"
                                                                                onClick={() =>
                                                                                    onAddProduct(
                                                                                        product
                                                                                    )
                                                                                }
                                                                            >
                                                                                <p className="text-sm font-medium">
                                                                                    {product.code ||
                                                                                        product.GRUP_CD}
                                                                                </p>
                                                                                <GoPlus className="h-4 w-4 text-orange-500" />
                                                                            </Badge>
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
                                                            <div className="flex flex-wrap gap-2 mt-4">
                                                                {addedProducts.map(
                                                                    (
                                                                        product,
                                                                        index
                                                                    ) => (
                                                                        <Badge
                                                                            key={
                                                                                index
                                                                            }
                                                                            variant="secondary"
                                                                            className="px-3 py-2 flex items-center gap-2 cursor-pointer whitespace-nowrap"
                                                                            onClick={() =>
                                                                                onRemoveProduct(
                                                                                    product
                                                                                )
                                                                            }
                                                                        >
                                                                            <p className="text-sm font-medium">
                                                                                {
                                                                                    product.code
                                                                                }
                                                                            </p>
                                                                            <GoX className="h-4 w-4 text-red-500" />
                                                                        </Badge>
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

                                {/* 主圖片 */}
                                <FormField
                                    control={form.control}
                                    name="imageUrl"
                                    render={() => (
                                        <FormItem>
                                            <FormLabel>
                                                國家書本圖片
                                                <span className="text-xs text-gray-400">
                                                    （上傳限制：50MB 以內）
                                                </span>
                                            </FormLabel>
                                            <label
                                                htmlFor="upload-country-showcase-main"
                                                className="
                                                    group relative flex h-64 w-full cursor-pointer 
                                                    items-center justify-center border rounded-xl
                                                    bg-[#2d2d2d]
                                                    hover:bg-[#3a3a3a]
                                                    "
                                            >
                                                {imgPreview ? (
                                                    <Image
                                                        src={imgPreview}
                                                        alt="國家書本圖片"
                                                        fill
                                                        className="rounded-xl object-contain"
                                                    />
                                                ) : (
                                                    <span className="text-sm text-gray-300">
                                                        點此上傳圖片
                                                    </span>
                                                )}
                                            </label>
                                            <input
                                                id="upload-country-showcase-main"
                                                type="file"
                                                className="hidden"
                                                onChange={(e) =>
                                                    handleFileInput(
                                                        e,
                                                        'imageUrl'
                                                    )
                                                }
                                            />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* 圖片1 */}
                                {/* <FormField
                                    control={form.control}
                                    name="imageUrl1"
                                    render={() => (
                                        <FormItem>
                                            <FormLabel>圖片 1（選填）</FormLabel>
                                            <label
                                                htmlFor="upload-country-showcase-1"
                                                className="group relative flex h-64 w-full cursor-pointer items-center justify-center border rounded-xl"
                                            >
                                                {imgPreview1 && (
                                                    <Image
                                                        src={imgPreview1}
                                                        alt="圖片1"
                                                        fill
                                                        className="rounded-xl object-contain bg-white"
                                                    />
                                                )}
                                            </label>
                                            <input
                                                id="upload-country-showcase-1"
                                                type="file"
                                                className="hidden"
                                                onChange={(e) => handleFileInput(e, 'imageUrl1')}
                                            />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                /> */}

                                {/* 圖片2 */}
                                <FormField
                                    control={form.control}
                                    name="imageUrl2"
                                    render={() => (
                                        <FormItem>
                                            <FormLabel>
                                                風景圖片（書本右側顯示的圖片）
                                                <span className="text-xs text-gray-400">
                                                    （上傳限制：50MB 以內）
                                                </span>
                                            </FormLabel>
                                            <label
                                                htmlFor="upload-country-showcase-2"
                                                className="
                                                    group relative flex h-64 w-full cursor-pointer 
                                                    items-center justify-center border rounded-xl
                                                    bg-[#2d2d2d]
                                                    hover:bg-[#3a3a3a]
                                                    "
                                            >
                                                {imgPreview2 ? (
                                                    <Image
                                                        src={imgPreview2}
                                                        alt="風景圖片"
                                                        fill
                                                        className="rounded-xl object-contain drop-shadow-[0_0_8px_rgba(0,0,0,0.2)]"
                                                    />
                                                ) : (
                                                    <span className="text-sm text-gray-400">
                                                        點此上傳圖片
                                                    </span>
                                                )}
                                            </label>

                                            <input
                                                id="upload-country-showcase-2"
                                                type="file"
                                                className="hidden"
                                                onChange={(e) =>
                                                    handleFileInput(
                                                        e,
                                                        'imageUrl2'
                                                    )
                                                }
                                            />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormError message={error} />
                            <FormSuccess message={success} />
                        </form>
                    </div>

                    <div className="rounded-b-2xl border-t bg-slate-50/60 p-4 flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                        >
                            取消
                        </Button>
                        <Button
                            type="submit"
                            form={formId}
                            disabled={
                                isLoading ||
                                isPending ||
                                isSubmitting ||
                                !form.getValues('imageUrl')
                            }
                        >
                            {isEdit ? '儲存變更' : '送出需求'}
                        </Button>
                    </div>
                </div>
            </div>
        </Form>
    );
}

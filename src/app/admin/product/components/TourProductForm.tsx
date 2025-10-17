'use client';

import React, {
    useEffect,
    useState,
    useTransition,
    useCallback,
    ChangeEvent,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
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
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useLoadingStore } from '@/stores/useLoadingStore';
import { useToast } from '@/hooks/use-toast';
import FormError from '@/components/auth/FormError';
import FormSuccess from '@/components/auth/FormSuccess';

import {
    TourProductCreateSchema,
    type TourProductCreateValues,
} from '@/schemas/tourProduct';
import {
    createTourProduct,
    editTourProduct,
} from '@/app/admin/product/action/product';
import { useQueryClient } from '@tanstack/react-query';
import { KEYS } from '@/features/product/queries/tourProductQueries';

import CreatableMultiSelect from '@/components/CreatableMultiSelect';
import { useAirports } from '@/features/airport/queries/airportQueries';
import { useCategories } from '@/features/category/queries/categoryQueries';
import { useSubCategories } from '@/features/categorysub/queries/subCategoryQueries';
import { useCities } from '@/features/city/queries/cityQueries';
import { TextareaInput } from '@/components/TextareaInput';
import { Combobox } from '@/components/combobox';
import { useCountriesAll } from '@/features/country/queries/countryQueries';
import { useFeedbacksAll } from '@/features/feedback/queries/feedbackQueries';
import { Separator } from '@/components/ui/separator';

const LIST_PATH = '/admin/product';

// ✅ 統一 Form 型別：id 可選
export type TourProductFormValues = TourProductCreateValues & { id?: string };

type Props = {
    id?: string;
    initialData?: Partial<TourProductFormValues> & { id?: string };
    method?: 'POST' | 'PUT';
};

type UserEntity = {
    id: string;
    name: string;
    email: string;
};

export default function TourProductForm({
    id,
    initialData,
    method = 'POST',
}: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const { show, hide } = useLoadingStore();
    const { toast } = useToast();
    const qc = useQueryClient();

    const [imgPreview, setImgPreview] = useState(
        initialData?.mainImageUrl ?? ''
    );
    const [isLoading, setIsLoading] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string>();
    const [success, setSuccess] = useState<string>();
    const [users, setUsers] = useState<UserEntity[]>([]);

    const isEdit = method === 'PUT' || Boolean(initialData?.id);

    const getCategoryLabel = () => {
        if (!pathname) return '';
        if (pathname.includes('/wizard/free')) return '自由行';
        if (pathname.includes('/wizard/group')) return '團體';
        if (pathname.includes('/wizard/rcar')) return '包車';
        return '';
    };

    const categoryLabel = getCategoryLabel();
    const headingTitle = isEdit
        ? categoryLabel
            ? `編輯${categoryLabel}產品`
            : '編輯行程產品'
        : '新增行程產品';

    const form = useForm<TourProductFormValues>({
        resolver: zodResolver(TourProductCreateSchema) as any,
        mode: 'onChange',
        defaultValues: {
            id: initialData?.id,
            code: initialData?.code ?? '',
            namePrefix: initialData?.namePrefix ?? '',
            name: initialData?.name ?? '',
            mainImageUrl: initialData?.mainImageUrl ?? '',
            summary: initialData?.summary ?? '',
            description: initialData?.description ?? '',
            days: initialData?.days,
            nights: initialData?.nights,
            departAirport: initialData?.departAirport ?? '',
            arriveCountry: initialData?.arriveCountry ?? '',
            arriveCity: initialData?.arriveCity ?? '',
            arriveAirport: initialData?.arriveAirport ?? '',
            category: initialData?.category ?? '',
            priceMin: initialData?.priceMin ?? 0,
            priceMax: initialData?.priceMax ?? null,
            tags: initialData?.tags ?? [],
            countries: initialData?.countries ?? [],
            note: initialData?.note ?? '',
            memo: initialData?.memo ?? '',
            status: initialData?.status ?? 1,
            staff: initialData?.staff ?? '',
            reminder: initialData?.reminder ?? '',
            policy: initialData?.policy ?? '',
            categoryId: initialData?.categoryId ?? '',
            subCategoryId: initialData?.subCategoryId ?? '',
            isFeatured: initialData?.isFeatured ?? false,
            feedbackId: initialData?.feedbackId ?? '',
        },
    });
    const { isValid, isSubmitting } = form.formState;

    const { data: airports = [] } = useAirports();
    const { data: cities = [] } = useCities();
    const { data: countries = [] } = useCountriesAll();
    const { data: categories = [] } = useCategories();
    const { data: subCategories = [] } = useSubCategories();
    const { data: feedbacks = [] } = useFeedbacksAll();

    const selectedCountry = form.watch('arriveCountry');
    const selectedCountryName =
        (countries ?? []).find((c: any) => c.code === selectedCountry)
            ?.nameZh ?? '';
    const filteredCities = (cities ?? []).filter(
        (c: any) => c.country === selectedCountryName
    );

    useEffect(() => {
        const fetchUsersAndMe = async () => {
            try {
                // 取得所有使用者（給下拉選單）
                const res = await fetch('/api/users');
                if (!res.ok) throw new Error('取得使用者清單失敗');
                const { users } = await res.json();
                setUsers(users || []);

                // 取得目前登入使用者
                const meRes = await fetch('/api/me');
                if (!meRes.ok) throw new Error('取得目前登入使用者失敗');
                const me = await meRes.json();

                // ✅ 解析 user.id
                const currentUserId = me?.user?.id;
                if (!isEdit && currentUserId) {
                    form.setValue('staff', currentUserId, {
                        shouldValidate: true,
                    });
                }
            } catch (err: any) {
                toast({
                    variant: 'destructive',
                    title: err?.message ?? '無法載入使用者資料',
                });
            }
        };

        fetchUsersAndMe();
    }, [isEdit, form, toast]);

    useEffect(() => {
        const subscription = form.watch((value, { name }) => {
            if (name === 'category' && value.category === 'GROUP') {
                if (form.getValues('feedbackId')) {
                    form.setValue('feedbackId', '', { shouldValidate: true });
                }
            }
        });
        return () => subscription.unsubscribe();
    }, [form]);
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

                form.setValue('mainImageUrl', url, { shouldValidate: true });
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

    const onSubmit: SubmitHandler<TourProductFormValues> = (values) => {
        setError(undefined);
        setSuccess(undefined);

        startTransition(async () => {
            setIsLoading(true);
            show();
            try {
                let res: { error?: string; success?: string } | undefined;

                if (isEdit) {
                    if (!id) {
                        setError('缺少編輯目標 ID');
                        return;
                    }
                    res = await editTourProduct(id, values);
                } else {
                    res = await createTourProduct(values);
                }

                if (res?.error) {
                    toast({ variant: 'destructive', title: res.error });
                    setError(res.error);
                } else {
                    toast({ title: res.success ?? '更新成功' });
                    setSuccess(
                        res?.success ?? (isEdit ? '更新成功' : '新增成功')
                    );

                    await qc.invalidateQueries({ queryKey: ['tourProducts'] });

                    if (isEdit && values.id) {
                        await qc.invalidateQueries({
                            queryKey: KEYS.detail(values.id),
                        });
                    }
                    router.refresh();
                    if (!isEdit) {
                        router.replace(LIST_PATH);
                    }
                }
            } catch (err: any) {
                setError(err?.message ?? (isEdit ? '更新失敗' : '新增失敗'));
            } finally {
                setIsLoading(false);
                hide();
            }
        });
    };

    const formId = 'tourProduct-form';

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
                            請填寫產品基本資料，帶 * 為必填。
                        </p>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        <form
                            id={formId}
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-6"
                        >
                            {/* hidden id */}
                            {isEdit && (
                                <FormField
                                    control={form.control}
                                    name="id"
                                    render={({ field }) => (
                                        <input type="hidden" {...field} />
                                    )}
                                />
                            )}

                            {/* === 基本資訊 === */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="isFeatured"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                是否精選(顯示在列表頁面的輪播與搜尋結果前六筆)
                                            </FormLabel>
                                            <Select
                                                value={
                                                    field.value
                                                        ? 'true'
                                                        : 'false'
                                                }
                                                onValueChange={(val) =>
                                                    field.onChange(
                                                        val === 'true'
                                                    )
                                                }
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="請選擇是否精選" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectGroup>
                                                        <SelectItem value="true">
                                                            是
                                                        </SelectItem>
                                                        <SelectItem value="false">
                                                            否
                                                        </SelectItem>
                                                    </SelectGroup>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>狀態</FormLabel>
                                            <Select
                                                value={String(
                                                    field.value ?? '1'
                                                )}
                                                onValueChange={(val) =>
                                                    field.onChange(Number(val))
                                                }
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="請選擇狀態" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectGroup>
                                                        <SelectLabel>
                                                            狀態
                                                        </SelectLabel>
                                                        <SelectItem value="1">
                                                            上架
                                                        </SelectItem>
                                                        <SelectItem value="2">
                                                            下架
                                                        </SelectItem>
                                                        <SelectItem value="3">
                                                            草稿
                                                        </SelectItem>
                                                    </SelectGroup>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <Separator className="my-4 bg-blue-600" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="required">
                                                行程編號
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="例：JP202509"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="category"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-red-900">
                                                類別
                                            </FormLabel>
                                            <Select
                                                value={field.value ?? ''}
                                                onValueChange={(val) =>
                                                    field.onChange(val)
                                                }
                                                disabled // ✅ 禁用變更
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="text-red-900 bg-gray-100 cursor-not-allowed">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectGroup className="text-red-900">
                                                        <SelectItem value="GROUP">
                                                            團體
                                                        </SelectItem>
                                                        <SelectItem value="FREE">
                                                            自由行
                                                        </SelectItem>
                                                        <SelectItem value="RCAR">
                                                            包車
                                                        </SelectItem>
                                                    </SelectGroup>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="namePrefix"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>名稱前綴</FormLabel>
                                            <FormControl>
                                                <Input
                                                    value={field.value ?? ''}
                                                    onChange={(e) =>
                                                        field.onChange(
                                                            e.target.value ||
                                                                null
                                                        )
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="required">
                                                名稱
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="例：北海道楓雪溫泉五日遊"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* 大類別 */}
                                <FormField
                                    control={form.control}
                                    name="categoryId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="required">
                                                大類別
                                            </FormLabel>
                                            <Select
                                                value={field.value ?? ''}
                                                onValueChange={(val) => {
                                                    field.onChange(val);
                                                    form.setValue(
                                                        'subCategoryId',
                                                        ''
                                                    );
                                                }}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="請選擇大類別" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectGroup>
                                                        {categories.map(
                                                            (cat: any) => (
                                                                <SelectItem
                                                                    key={cat.id}
                                                                    value={
                                                                        cat.id
                                                                    }
                                                                >
                                                                    {cat.nameZh}{' '}
                                                                    ({cat.code})
                                                                </SelectItem>
                                                            )
                                                        )}
                                                    </SelectGroup>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* 子類別 */}
                                <FormField
                                    control={form.control}
                                    name="subCategoryId"
                                    render={({ field }) => {
                                        const filteredSubs =
                                            subCategories.filter(
                                                (sub: any) =>
                                                    sub.categoryId ===
                                                    form.watch('categoryId')
                                            );

                                        return (
                                            <FormItem>
                                                <FormLabel className="required">
                                                    子類別
                                                </FormLabel>
                                                <Select
                                                    value={field.value ?? ''}
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                    disabled={
                                                        !form.watch(
                                                            'categoryId'
                                                        )
                                                    }
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="請選擇子類別" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectGroup>
                                                            {filteredSubs.map(
                                                                (sub: any) => (
                                                                    <SelectItem
                                                                        key={
                                                                            sub.id
                                                                        }
                                                                        value={
                                                                            sub.id
                                                                        }
                                                                    >
                                                                        {
                                                                            sub.nameZh
                                                                        }{' '}
                                                                        (
                                                                        {
                                                                            sub.code
                                                                        }
                                                                        )
                                                                    </SelectItem>
                                                                )
                                                            )}
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        );
                                    }}
                                />
                            </div>

                            {/* === 行程時間 === */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                {/* 天數 */}
                                <FormField
                                    control={form.control}
                                    name="days"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="required">
                                                天數
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="text"
                                                    inputMode="numeric" // ✅ 手機顯示數字鍵盤
                                                    value={
                                                        field.value?.toString() ??
                                                        ''
                                                    }
                                                    onChange={(e) => {
                                                        const val =
                                                            e.target.value.trim();

                                                        // ✅ 允許清空（清空時傳 null）
                                                        if (val === '') {
                                                            field.onChange(
                                                                null
                                                            );
                                                            return;
                                                        }

                                                        // ✅ 僅允許數字
                                                        const num = Number(val);
                                                        if (!isNaN(num))
                                                            field.onChange(num);
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* 晚數 */}
                                <FormField
                                    control={form.control}
                                    name="nights"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="required">
                                                晚數
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={
                                                        field.value?.toString() ??
                                                        ''
                                                    }
                                                    onChange={(e) => {
                                                        const val =
                                                            e.target.value.trim();

                                                        if (val === '') {
                                                            field.onChange(
                                                                null
                                                            );
                                                            return;
                                                        }

                                                        const num = Number(val);
                                                        if (!isNaN(num))
                                                            field.onChange(num);
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* 最低價 */}
                                <FormField
                                    control={form.control}
                                    name="priceMin"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>最低價</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={
                                                        field.value?.toString() ??
                                                        ''
                                                    }
                                                    onChange={(e) => {
                                                        const val =
                                                            e.target.value.trim();

                                                        // ✅ 清空 → null
                                                        if (val === '') {
                                                            field.onChange(
                                                                null
                                                            );
                                                            return;
                                                        }

                                                        // ✅ 僅接受數字
                                                        const num = Number(val);
                                                        if (!isNaN(num))
                                                            field.onChange(num);
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* 最高價 */}
                                {form.watch('category') !== 'FREE' &&
                                form.watch('category') !== 'RCAR' ? (
                                    <FormField
                                        control={form.control}
                                        name="priceMax"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>最高價</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="text"
                                                        inputMode="numeric"
                                                        value={
                                                            field.value?.toString() ??
                                                            ''
                                                        }
                                                        onChange={(e) => {
                                                            const val =
                                                                e.target.value.trim();
                                                            if (val === '') {
                                                                field.onChange(
                                                                    null
                                                                );
                                                                return;
                                                            }
                                                            const num =
                                                                Number(val);
                                                            if (!isNaN(num))
                                                                field.onChange(
                                                                    num
                                                                );
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                ) : (
                                    <div />
                                )}

                                <FormField
                                    control={form.control}
                                    name="departAirport"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>出發機場</FormLabel>
                                            <FormControl>
                                                <Combobox
                                                    options={(
                                                        airports ?? []
                                                    ).map((a: any) => ({
                                                        value: a.code,
                                                        label: `${a.nameZh}`,
                                                    }))}
                                                    value={field.value ?? ''}
                                                    onChange={field.onChange}
                                                    placeholder="選擇出發機場"
                                                    searchPlaceholder="搜尋機場..."
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="arriveAirport"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>抵達機場</FormLabel>
                                            <FormControl>
                                                <Combobox
                                                    options={(
                                                        airports ?? []
                                                    ).map((a: any) => ({
                                                        value: a.code,
                                                        label: `${a.nameZh} (${a.code})`,
                                                    }))}
                                                    value={field.value ?? ''}
                                                    onChange={field.onChange}
                                                    placeholder="選擇抵達機場"
                                                    searchPlaceholder="搜尋機場..."
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="arriveCountry"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>抵達國家</FormLabel>
                                            <FormControl>
                                                <Combobox
                                                    options={(countries ?? [])
                                                        .sort(
                                                            (a: any, b: any) =>
                                                                a.nameEn.localeCompare(
                                                                    b.nameEn,
                                                                    'en'
                                                                )
                                                        )
                                                        .map((c: any) => ({
                                                            value: c.code,
                                                            label: `${c.nameZh} ${c.nameEn} (${c.code})`,
                                                        }))}
                                                    value={field.value ?? ''}
                                                    onChange={(val) => {
                                                        field.onChange(val);
                                                        form.setValue(
                                                            'arriveCity',
                                                            ''
                                                        ); // ✅ 切換國家時清空城市
                                                    }}
                                                    placeholder="選擇抵達國家"
                                                    searchPlaceholder="搜尋國家..."
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="arriveCity"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>抵達城市</FormLabel>
                                            <FormControl>
                                                <Combobox
                                                    options={filteredCities.map(
                                                        (c: any) => ({
                                                            value: c.code,
                                                            label: `${c.nameZh} ${c.nameEn ?? ''} (${c.code})`,
                                                        })
                                                    )}
                                                    value={field.value ?? ''}
                                                    onChange={field.onChange}
                                                    placeholder={
                                                        selectedCountry
                                                            ? '選擇抵達城市'
                                                            : '請先選擇國家'
                                                    }
                                                    searchPlaceholder="搜尋城市..."
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="deposit"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            訂金（可輸入金額或說明）
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="text"
                                                value={field.value ?? ''}
                                                onChange={(e) =>
                                                    field.onChange(
                                                        e.target.value || null
                                                    )
                                                }
                                                placeholder="例如：NT$ 10,000 起 或 需預付 30%"
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
                            <FormField
                                control={form.control}
                                name="tags"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>標籤</FormLabel>
                                        <FormControl>
                                            <CreatableMultiSelect
                                                value={(field.value ?? []).map(
                                                    (t) => String(t)
                                                )}
                                                onChange={(vals) =>
                                                    form.setValue(
                                                        'tags',
                                                        vals,
                                                        { shouldValidate: true }
                                                    )
                                                }
                                                options={[]}
                                                placeholder="輸入後按 Enter 新增標籤"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="countries"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>參訪國家 (多選)</FormLabel>
                                        <FormControl>
                                            <CreatableMultiSelect
                                                value={field.value ?? []}
                                                onChange={(vals) =>
                                                    form.setValue(
                                                        'countries',
                                                        vals,
                                                        { shouldValidate: true }
                                                    )
                                                }
                                                options={countries.map(
                                                    (c: any) => ({
                                                        label: c.nameZh,
                                                        value: c.code,
                                                    })
                                                )}
                                                placeholder="選擇或輸入國家"
                                                creatable={false}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="summary"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            行程簡述 (出現在列表頁面的卡片上)
                                        </FormLabel>
                                        <FormControl>
                                            <TextareaInput
                                                rows={3}
                                                {...field}
                                                value={field.value ?? ''}
                                                placeholder="請輸入行程簡短介紹（出現在列表頁面的卡片上）"
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
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            <span className="font-bold text-lg">
                                                團體:
                                            </span>{' '}
                                            貼心安排　｜　
                                            <span className="font-bold text-lg">
                                                自由行/包車:
                                            </span>{' '}
                                            售價包含
                                        </FormLabel>
                                        <FormControl>
                                            <TextareaInput
                                                rows={8}
                                                {...field}
                                                value={field.value ?? ''}
                                                placeholder="請輸入貼心安排"
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
                            <FormField
                                control={form.control}
                                name="note"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            <span className="font-bold text-lg">
                                                備註:
                                            </span>{' '}
                                            (內頁中的備註)
                                        </FormLabel>
                                        <FormControl>
                                            <TextareaInput
                                                rows={8}
                                                {...field}
                                                value={field.value ?? ''}
                                                placeholder="請輸入行程備註"
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
                            <FormField
                                control={form.control}
                                name="memo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            <span className="font-bold text-lg">
                                                注意:
                                            </span>{' '}
                                            (列表中的備註)
                                        </FormLabel>
                                        <FormControl>
                                            <TextareaInput
                                                rows={8}
                                                {...field}
                                                value={field.value ?? ''}
                                                placeholder="請輸入列表頁備註"
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
                            <FormField
                                control={form.control}
                                name="reminder"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            <span className="font-bold text-lg">
                                                團體:
                                            </span>{' '}
                                            貼心提醒餐團須知 旅客篇　｜　
                                            <span className="font-bold text-lg">
                                                自由行/包車:
                                            </span>{' '}
                                            服務流程與注意事項 服務流程
                                        </FormLabel>
                                        <FormControl>
                                            <TextareaInput
                                                rows={8}
                                                {...field}
                                                value={field.value ?? ''}
                                                placeholder="請輸入"
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

                            <FormField
                                control={form.control}
                                name="policy"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            <span className="font-bold text-lg">
                                                團體:
                                            </span>{' '}
                                            貼心提醒餐團須知 航空篇　｜　
                                            <span className="font-bold text-lg">
                                                自由行/包車:
                                            </span>{' '}
                                            服務流程與注意事項 旅遊注意事項
                                        </FormLabel>
                                        <FormControl>
                                            <TextareaInput
                                                rows={8}
                                                {...field}
                                                value={field.value ?? ''}
                                                placeholder="請輸入請輸入貼心提醒餐團須知 航空篇"
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
                            <FormField
                                control={form.control}
                                name="mainImageUrl"
                                render={() => (
                                    <FormItem>
                                        <FormLabel>行程圖片</FormLabel>

                                        <label
                                            htmlFor="upload-airline"
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
                                            id="upload-airline"
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

                            {/* 旅客迴響 */}
                            {form.watch('category') !== 'GROUP' && (
                                <FormField
                                    control={form.control}
                                    name="feedbackId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                旅客迴響
                                                (只有自由行的產品會出現推薦的旅客迴響在頁面中)
                                            </FormLabel>
                                            <FormControl>
                                                <Combobox
                                                    options={(
                                                        feedbacks ?? []
                                                    ).map((f: any) => ({
                                                        value: f.id,
                                                        label: `${f.nickname} - ${f.title}`,
                                                    }))}
                                                    value={field.value ?? ''}
                                                    onChange={(val) => {
                                                        field.onChange(val);
                                                    }}
                                                    placeholder="選擇旅客迴響"
                                                    searchPlaceholder="搜尋暱稱或標題..."
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            {/* === 其他：上架人員 === */}
                            <FormField
                                control={form.control}
                                name="staff"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>上架人員</FormLabel>
                                        <Select
                                            value={field.value ?? ''}
                                            onValueChange={field.onChange}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="請選擇人員" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectGroup>
                                                    <SelectLabel>
                                                        選擇上架人員
                                                    </SelectLabel>
                                                    {users.map((u) => (
                                                        <SelectItem
                                                            key={u.id}
                                                            value={u.id}
                                                        >
                                                            {u.name} ({u.email})
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
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

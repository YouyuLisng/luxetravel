'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
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
import { useLexicons } from '@/features/lexicon/queries/lexiconQueries';
import { useAirports } from '@/features/airport/queries/airportQueries';
import { useCategories } from '@/features/category/queries/categoryQueries';
import { useSubCategories } from '@/features/categorysub/queries/subCategoryQueries';
import { useCities } from '@/features/city/queries/cityQueries';
import useCountry from '@/features/country/hooks/useCountry';
import { TextareaInput } from '@/components/TextareaInput';

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
    const { show, hide } = useLoadingStore();
    const { toast } = useToast();
    const qc = useQueryClient();

    const [isLoading, setIsLoading] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string>();
    const [success, setSuccess] = useState<string>();
    const [users, setUsers] = useState<UserEntity[]>([]);

    const isEdit = method === 'PUT' || Boolean(initialData?.id);
    const headingTitle = isEdit ? '編輯行程產品' : '新增行程產品';

    const form = useForm<TourProductFormValues>({
        resolver: zodResolver(TourProductCreateSchema) as any,
        mode: 'onChange',
        defaultValues: {
            id: initialData?.id,
            code: initialData?.code ?? '',
            namePrefix: initialData?.namePrefix ?? '',
            name: initialData?.name ?? '',
            description: initialData?.description ?? '',
            days: initialData?.days ?? 1,
            nights: initialData?.nights ?? 0,
            departAirport: initialData?.departAirport ?? '',
            arriveCountry: initialData?.arriveCountry ?? '',
            arriveCity: initialData?.arriveCity ?? '',
            arriveAirport: initialData?.arriveAirport ?? '',
            category: initialData?.category ?? '',
            priceMin: initialData?.priceMin ?? 0,
            priceMax: initialData?.priceMax ?? null,
            tags: initialData?.tags ?? [],
            note: initialData?.note ?? '',
            status: initialData?.status ?? 1,
            staff: initialData?.staff ?? '',
            reminder: initialData?.reminder ?? '',
            policy: initialData?.policy ?? '',
            categoryId: initialData?.categoryId ?? '',
            subCategoryId: initialData?.subCategoryId ?? '',
        },
    });
    const { isValid, isSubmitting } = form.formState;

    const { data: notes = [] } = useLexicons({ type: '備註' });
    const { data: reminders = [] } = useLexicons({ type: '貼心提醒' });
    const { data: policys = [] } = useLexicons({ type: '參團須知' });
    const { data: airports = [] } = useAirports();
    const { data: cities = [] } = useCities();
    const { rows: countries } = useCountry();
    const { data: categories = [] } = useCategories();
    const { data: subCategories = [] } = useSubCategories();

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await fetch('/api/users');
                if (!res.ok) throw new Error('取得使用者失敗');
                const { users } = await res.json();
                setUsers(users || []);

                const meRes = await fetch('/api/me');
                if (meRes.ok) {
                    const me = await meRes.json();
                    if (!isEdit && me?.id) {
                        form.setValue('staff', me.id, { shouldValidate: true });
                    }
                }
            } catch (err: any) {
                toast({
                    variant: 'destructive',
                    title: err?.message ?? '無法載入使用者',
                });
            }
        };
        fetchUsers();
    }, [toast, form, isEdit]);

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
                    setError(res.error);
                } else {
                    setSuccess(
                        res?.success ?? (isEdit ? '更新成功' : '新增成功')
                    );

                    await qc.invalidateQueries({ queryKey: KEYS.list() });
                    if (isEdit && values.id) {
                        await qc.invalidateQueries({
                            queryKey: KEYS.detail(values.id),
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
                                    name="namePrefix"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>名稱前置</FormLabel>
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
                                        // 依照已選的大類別過濾
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
                                <FormField
                                    control={form.control}
                                    name="category"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>類別</FormLabel>
                                            <Select
                                                value={field.value ?? ''}
                                                onValueChange={(val) =>
                                                    field.onChange(val)
                                                }
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="請選擇類別" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectGroup>
                                                        <SelectLabel>
                                                            類別
                                                        </SelectLabel>
                                                        <SelectItem value="GROUP">
                                                            團體
                                                        </SelectItem>
                                                        <SelectItem value="FREE">
                                                            自由行
                                                        </SelectItem>
                                                        <SelectItem value="CUST">
                                                            包車
                                                        </SelectItem>
                                                        <SelectItem value="RECO">
                                                            推薦
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

                            {/* === 行程時間 === */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                                                    type="number"
                                                    {...field}
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
                                                    type="number"
                                                    {...field}
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
                                <FormField
                                    control={form.control}
                                    name="departAirport"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>出發機場</FormLabel>
                                            <Select
                                                value={field.value ?? ''}
                                                onValueChange={field.onChange}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="選擇出發機場" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectGroup>
                                                        {airports.map((a) => (
                                                            <SelectItem
                                                                key={a.id}
                                                                value={a.code}
                                                            >
                                                                {a.nameZh} (
                                                                {a.code})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectGroup>
                                                </SelectContent>
                                            </Select>
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
                                            <Select
                                                value={field.value ?? ''}
                                                onValueChange={field.onChange}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="選擇抵達國家" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectGroup>
                                                        {countries.map(
                                                            (c: any) => (
                                                                <SelectItem
                                                                    key={c.id}
                                                                    value={
                                                                        c.code
                                                                    }
                                                                >
                                                                    {c.nameZh} (
                                                                    {c.code})
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

                                <FormField
                                    control={form.control}
                                    name="arriveCity"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>抵達城市</FormLabel>
                                            <Select
                                                value={field.value ?? ''}
                                                onValueChange={field.onChange}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="選擇抵達城市" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectGroup>
                                                        {cities.map(
                                                            (c: any) => (
                                                                <SelectItem
                                                                    key={c.id}
                                                                    value={
                                                                        c.code
                                                                    }
                                                                >
                                                                    {c.nameZh} (
                                                                    {c.code})
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

                                <FormField
                                    control={form.control}
                                    name="arriveAirport"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>抵達機場</FormLabel>
                                            <Select
                                                value={field.value ?? ''}
                                                onValueChange={field.onChange}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="選擇抵達機場" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectGroup>
                                                        {airports.map((a) => (
                                                            <SelectItem
                                                                key={a.id}
                                                                value={a.code}
                                                            >
                                                                {a.nameZh} (
                                                                {a.code})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectGroup>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* === 價格 & 標籤 === */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="priceMin"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>最低價</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    {...field}
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
                                <FormField
                                    control={form.control}
                                    name="priceMax"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>最高價</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    value={field.value ?? ''}
                                                    onChange={(e) =>
                                                        field.onChange(
                                                            e.target.value ===
                                                                ''
                                                                ? null
                                                                : Number(
                                                                      e.target
                                                                          .value
                                                                  )
                                                        )
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
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

                            {/* === 使用 Lexicon 的欄位 === */}
                            <FormField
                                control={form.control}
                                name="note"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>備註</FormLabel>
                                        <Select
                                            value={field.value ?? ''}
                                            onValueChange={field.onChange}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="選擇備註" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectGroup>
                                                    {notes.map((d: any) => (
                                                        <SelectItem
                                                            key={d.id}
                                                            value={d.context}
                                                        >
                                                            {d.title}
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="reminder"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>貼心提醒</FormLabel>
                                        <Select
                                            value={field.value ?? ''}
                                            onValueChange={field.onChange}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="選擇貼心提醒" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectGroup>
                                                    {reminders.map((d: any) => (
                                                        <SelectItem
                                                            key={d.id}
                                                            value={d.context}
                                                        >
                                                            {d.title}
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="policy"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>參團須知</FormLabel>
                                        <Select
                                            value={field.value ?? ''}
                                            onValueChange={field.onChange}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="選擇參團須知" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectGroup>
                                                    {policys.map((d: any) => (
                                                        <SelectItem
                                                            key={d.id}
                                                            value={d.context}
                                                        >
                                                            {d.title}
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>行程描述</FormLabel>
                                        <FormControl>
                                            <TextareaInput
                                                rows={8}
                                                {...field}
                                                value={field.value ?? ''}
                                                placeholder="請輸入行程描述"
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

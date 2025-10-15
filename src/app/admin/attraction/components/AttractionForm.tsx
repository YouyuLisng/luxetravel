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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import FormError from '@/components/auth/FormError';
import FormSuccess from '@/components/auth/FormSuccess';

import { useToast } from '@/hooks/use-toast';
import { useLoadingStore } from '@/stores/useLoadingStore';

import {
    createAttraction,
    editAttraction,
} from '@/app/admin/attraction/action/attraction';
import { useQueryClient } from '@tanstack/react-query';
import { KEYS } from '@/features/attraction/queries/attractionQueries';

import { useCities } from '@/features/city/queries/cityQueries';
import { TextareaInput } from '@/components/TextareaInput';
import { useRegions } from '@/features/region/queries/regionQueries';
import { Combobox } from '@/components/combobox';
import { useCountriesAll } from '@/features/country/queries/countryQueries';

/* ========== Schema ========== */
const FormSchema = z.object({
    code: z.string().optional().nullable(),
    nameZh: z.string().min(1, '請輸入中文名稱'),
    nameEn: z.string().min(1, '請輸入英文名稱'),
    content: z.string().min(1, '請輸入內容介紹'),
    region: z.string().min(1, '請輸入地區'),
    country: z.string().min(1, '請輸入國家'),
    city: z.string().optional().nullable(),
    tags: z.array(z.string()).optional().default([]),
    imageUrl: z.string().url('請輸入正確的圖片網址').optional().nullable(),
    enabled: z.boolean().optional().default(true),
});

type AttractionFormValues = z.input<typeof FormSchema>;

interface Props {
    mode?: 'create' | 'edit';
    initialData?: Partial<AttractionFormValues> & { id?: string };
}

const LIST_PATH = '/admin/attraction';

export default function AttractionForm({
    mode = 'create',
    initialData,
}: Props) {
    const isEdit = mode === 'edit';
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const { show, hide } = useLoadingStore();
    const qc = useQueryClient();

    const page = searchParams.get('page') || '1';
    const pageSize = searchParams.get('pageSize') || '50';
    const q = searchParams.get('q') || '';
    const LIST_PATH = `/admin/attraction?page=${page}&pageSize=${pageSize}&q=${q}`;
        console.log("LIST_PATH:", LIST_PATH)
    const [isPending, startTransition] = useTransition();
    const [isLoading, setIsLoading] = useState(false);
    const [imgPreview, setImgPreview] = useState(initialData?.imageUrl ?? '');
    const [error, setError] = useState<string>();
    const [success, setSuccess] = useState<string>();

    const { data: cities = [] } = useCities();
    const { data: countries } = useCountriesAll();
    const { data: regions = [] } = useRegions();

    const form = useForm<AttractionFormValues>({
        resolver: zodResolver(FormSchema),
        mode: 'onChange',
        defaultValues: {
            code: initialData?.code ?? '',
            nameZh: initialData?.nameZh ?? '',
            nameEn: initialData?.nameEn ?? '',
            content: initialData?.content ?? '',
            region: initialData?.region ?? '',
            country: initialData?.country ?? '',
            city: initialData?.city ?? '',
            tags: initialData?.tags ?? [],
            imageUrl: initialData?.imageUrl ?? null,
            enabled: initialData?.enabled ?? true,
        },
    });

    const { isValid, isSubmitting } = form.formState;
    const selectedCountry = form.watch('country');

    const filteredCities = cities.filter(
        (c: any) =>
            c.countryNameZh === selectedCountry || c.country === selectedCountry
    );

    const headingTitle = isEdit ? '編輯景點' : '新增景點';
    const formId = 'attraction-form';

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
                description: '上限 50MB',
                duration: 1800,
            });
            return;
        }
        handleImageUpload(file);
    };

    const onSubmit: SubmitHandler<AttractionFormValues> = (values) => {
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
                    res = await editAttraction(id, values as any);
                    if (!res?.error) {
                        await Promise.all([
                            qc.invalidateQueries({ queryKey: ['attractions'] }),
                            qc.invalidateQueries({ queryKey: KEYS.detail(id) }),
                        ]);
                    }
                } else {
                    res = await createAttraction(values as any);
                    if (!res?.error) {
                        await qc.invalidateQueries({
                            queryKey: ['attractions'],
                        });
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
                setError(e?.message ?? '操作失敗');
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
                    <div className="border-b border-slate-100 p-6">
                        <h2 className="text-xl font-semibold text-slate-900">
                            {headingTitle}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            請填寫相關資料。帶 * 為必填。
                        </p>
                    </div>

                    <div className="p-6">
                        <form
                            id={formId}
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-8"
                        >
                            <div className="grid grid-cols-1 gap-6">
                                {/* 中文名稱 */}
                                <FormField
                                    control={form.control}
                                    name="nameZh"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="after:ml-1 after:text-rose-500 after:content-['*']">
                                                中文名稱
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="例：艾菲爾鐵塔"
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

                                {/* 英文名稱 */}
                                <FormField
                                    control={form.control}
                                    name="nameEn"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="after:ml-1 after:text-rose-500 after:content-['*']">
                                                英文名稱
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="例：Eiffel Tower"
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

                                {/* 內容介紹 */}
                                <FormField
                                    control={form.control}
                                    name="content"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="after:ml-1 after:text-rose-500 after:content-['*']">
                                                內容介紹
                                            </FormLabel>
                                            <FormControl>
                                                <TextareaInput
                                                    {...field}
                                                    className="min-h-[120px]"
                                                    placeholder="請輸入景點介紹"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* 地區 Combobox */}
                                <FormField
                                    control={form.control}
                                    name="region"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>抵達地區</FormLabel>
                                            <FormControl>
                                                <Combobox
                                                    options={regions.map(
                                                        (r: any) => ({
                                                            value: r.nameZh,
                                                            label: `${r.nameZh} (${r.code})`,
                                                        })
                                                    )}
                                                    value={field.value ?? ''}
                                                    onChange={field.onChange}
                                                    placeholder="選擇抵達地區"
                                                    searchPlaceholder="搜尋地區..."
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* 國家 Combobox */}
                                <FormField
                                    control={form.control}
                                    name="country"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>抵達國家</FormLabel>
                                            <FormControl>
                                                <Combobox
                                                    options={[
                                                        ...(countries ?? []),
                                                    ]
                                                        .sort(
                                                            (a: any, b: any) =>
                                                                a.nameEn.localeCompare(
                                                                    b.nameEn,
                                                                    'en'
                                                                )
                                                        )
                                                        .map((c: any) => ({
                                                            value: c.nameZh,
                                                            label: `${c.nameZh} (${c.code})`,
                                                        }))}
                                                    value={field.value ?? ''}
                                                    onChange={(val) => {
                                                        field.onChange(val);
                                                        if (!isEdit) {
                                                            // 新增模式下才清空城市
                                                            form.setValue(
                                                                'city',
                                                                ''
                                                            );
                                                        }
                                                    }}
                                                    placeholder="選擇抵達國家"
                                                    searchPlaceholder="搜尋國家..."
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* 城市 Combobox */}
                                <FormField
                                    control={form.control}
                                    name="city"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>抵達城市</FormLabel>
                                            <FormControl>
                                                <Combobox
                                                    options={filteredCities.map(
                                                        (c: any) => ({
                                                            value: c.nameZh,
                                                            label: `${c.nameZh} (${c.code})`,
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

                                {/* 啟用開關 */}
                                <FormField
                                    control={form.control}
                                    name="enabled"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>啟用</FormLabel>
                                            <div>
                                                <Switch
                                                    checked={!!field.value}
                                                    onCheckedChange={
                                                        field.onChange
                                                    }
                                                />
                                            </div>
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
                                            <FormLabel>圖片（選填）</FormLabel>
                                            <label
                                                htmlFor="upload-attraction"
                                                className="group relative flex h-64 w-full cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-slate-50/60 transition hover:bg-slate-50"
                                            >
                                                {imgPreview ? (
                                                    <Image
                                                        src={imgPreview}
                                                        alt="預覽圖片"
                                                        fill
                                                        className="rounded-xl object-contain bg-white"
                                                    />
                                                ) : (
                                                    <div className="text-slate-500">
                                                        拖曳或點擊上傳
                                                    </div>
                                                )}
                                            </label>
                                            <input
                                                id="upload-attraction"
                                                type="file"
                                                className="hidden"
                                                onChange={handleFileInput}
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

                    <div className="border-t border-slate-100 bg-slate-50/60 p-4">
                        <div className="flex justify-end gap-3">
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
                                disabled={!isValid || isSubmitting}
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

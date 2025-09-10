'use client';

import { useState, useTransition, useCallback, ChangeEvent } from 'react';
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
import useCountry from '@/features/country/hooks/useCountry';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { TextareaInput } from '@/components/TextareaInput';
import { useRegions } from '@/features/region/queries/regionQueries';
/* ========== Zod Schema：符合 Prisma/Server 行為 ========== */
const FormSchema = z.object({
    code: z.string().optional().nullable(), // 選填
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
    const { toast } = useToast();
    const { show, hide } = useLoadingStore();
    const qc = useQueryClient();

    const [isPending, startTransition] = useTransition();
    const [isLoading, setIsLoading] = useState(false);
    const [imgPreview, setImgPreview] = useState(initialData?.imageUrl ?? '');
    const [error, setError] = useState<string>();
    const [success, setSuccess] = useState<string>();

    const { data: cities = [] } = useCities();
    const { rows: countries } = useCountry(1, 9999);
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

    const headingTitle = isEdit ? '編輯景點' : '新增景點';
    const formId = 'attraction-form';

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

        const img = new window.Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            const { naturalWidth, naturalHeight } = img;

            if (naturalWidth < 500 || naturalHeight < 300) {
                toast({
                    variant: 'destructive',
                    title: '圖片尺寸過小',
                    description: `需至少 500x300，實際為 ${naturalWidth}x${naturalHeight}`,
                    duration: 2000,
                });
                return;
            }

            if (naturalWidth < naturalHeight) {
                toast({
                    variant: 'destructive',
                    title: '圖片比例不符',
                    description: `寬必須大於或等於高，目前為 ${naturalWidth}x${naturalHeight}`,
                    duration: 2000,
                });
                return;
            }

            handleImageUpload(file);
        };
    };

    // tags：用 CreatableMultiSelect，多選字串
    type Option = { label: string; value: string };
    const tagOptions: Option[] = (initialData?.tags ?? []).map((t) => ({
        label: t,
        value: t,
    }));
    const handleTagsChange = (vals: string[]) => {
        form.setValue('tags', vals, { shouldValidate: true });
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

                    res = await editAttraction(id, {
                        code: values.code ?? null, // 允許清空
                        nameZh: values.nameZh,
                        nameEn: values.nameEn,
                        content: values.content,
                        region: values.region,
                        country: values.country,
                        city: values.city ?? null,
                        tags: values.tags ?? [],
                        imageUrl: values.imageUrl ?? null,
                        enabled: values.enabled ?? true,
                    } as any);

                    if (!res?.error) {
                        await Promise.all([
                            qc.invalidateQueries({ queryKey: ['attractions'] }),
                            qc.invalidateQueries({
                                queryKey: KEYS.detail(id!),
                            }),
                        ]);
                    }
                } else {
                    res = await createAttraction({
                        code: values.code ?? null,
                        nameZh: values.nameZh,
                        nameEn: values.nameEn,
                        content: values.content,
                        region: values.region,
                        country: values.country,
                        city: values.city ?? null,
                        tags: values.tags ?? [],
                        imageUrl: values.imageUrl ?? null,
                        enabled: values.enabled ?? true,
                    } as any);

                    if (!res?.error) {
                        await qc.invalidateQueries({ queryKey: ['attractions'] });
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
                                {/* 代碼（選填） */}
                                {/* <FormField
                                    control={form.control}
                                    name="code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                景點代碼（選填）
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    name={field.name}
                                                    ref={field.ref}
                                                    onBlur={field.onBlur}
                                                    value={field.value ?? ''} // 避免 null
                                                    onChange={(e) =>
                                                        field.onChange(
                                                            e.target.value
                                                        )
                                                    } // 明確帶 onChange
                                                    placeholder="例：PARIS01"
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
                                /> */}
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
                                                    className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                    placeholder="請輸入景點介紹內容"
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

                                {/* 地區 */}
                                <FormField
                                    control={form.control}
                                    name="region"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>抵達地區</FormLabel>
                                            <Select
                                                value={field.value ?? ''}
                                                onValueChange={field.onChange}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="選擇抵達地區" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectGroup>
                                                        {regions.map(
                                                            (c: any) => (
                                                                <SelectItem
                                                                    key={c.id}
                                                                    value={
                                                                        c.nameZh
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
                                {/* 國家 */}
                                <FormField
                                    control={form.control}
                                    name="country"
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
                                                                        c.nameZh
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
                                {/* 城市（選填） */}
                                <FormField
                                    control={form.control}
                                    name="city"
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
                                                                        c.nameZh
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
                                {/* Tags（多選字串） */}
                                {/* <FormField
                                    control={form.control}
                                    name="tags"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                標籤（可複選）
                                            </FormLabel>
                                            <FormControl>
                                                <CreatableMultiSelect
                                                    value={(
                                                        field.value ?? []
                                                    ).map((t) => String(t))}
                                                    onChange={handleTagsChange}
                                                    options={tagOptions}
                                                    placeholder="輸入後按 Enter 新增標籤"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                /> */}

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
                                                    onCheckedChange={(v) =>
                                                        field.onChange(
                                                            Boolean(v)
                                                        )
                                                    }
                                                    disabled={
                                                        isPending ||
                                                        isLoading ||
                                                        isSubmitting
                                                    }
                                                />
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* 圖片上傳（選填） */}
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
                                                <div className="absolute inset-0 z-10" />
                                                <div
                                                    className={`z-[3] flex flex-col items-center justify-center px-10 text-center ${imgPreview
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
                                                id="upload-attraction"
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

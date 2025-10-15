'use client';

import {
    useState,
    useTransition,
    useCallback,
    ChangeEvent,
    useEffect,
} from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
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
import FormError from '@/components/auth/FormError';
import FormSuccess from '@/components/auth/FormSuccess';

import { useToast } from '@/hooks/use-toast';
import { useLoadingStore } from '@/stores/useLoadingStore';

import {
    createArticle,
    editArticle,
} from '@/app/admin/travelarticle/action/travelArticle';

import CreatableMultiSelect from '@/components/CreatableMultiSelect';

import { useQueryClient } from '@tanstack/react-query';
import { KEYS } from '@/features/travelArticle/queries/travelArticleQueries'; // ✅ 匯入 KEYS

type CountryOption = { label: string; value: string };

// ========== 本地表單 Schema（含 countryIds: string[]）==========
const FormSchema = z.object({
    title: z.string().min(1, '請輸入標題'),
    subtitle: z.string().min(1, '請輸入副標題'),
    linkUrl: z.string().url('請輸入正確的網址'),
    imageUrl: z.string().min(1, '請上傳圖片'),
    countryIds: z.array(z.string().min(1)),
});
type TravelArticleFormValues = z.infer<typeof FormSchema>;

interface Props {
    mode?: 'create' | 'edit';
    initialData?: Partial<TravelArticleFormValues> & { id?: string } & {
        // 兼容可能帶進來的舊欄位形式
        countryId?: string;
        countries?: Array<{ id: string; name?: string; nameZh?: string }>;
    };
}

export default function TravelArticleForm({
    mode = 'create',
    initialData,
}: Props) {
    const isEdit = mode === 'edit';
    const router = useRouter();
    const { toast } = useToast();
    const { show, hide } = useLoadingStore();
    const qc = useQueryClient();

    const searchParams = useSearchParams();
    const page = searchParams.get('page') || '1';
    const pageSize = searchParams.get('pageSize') || '50';
    const q = searchParams.get('q') || '';
    const LIST_PATH = `/admin/travelarticle?page=${page}&pageSize=${pageSize}&q=${q}`;

    const [isPending, startTransition] = useTransition();
    const [isLoading, setIsLoading] = useState(false);
    const [imgPreview, setImgPreview] = useState(initialData?.imageUrl ?? '');
    const [error, setError] = useState<string>();
    const [success, setSuccess] = useState<string>();

    // 取得國家選項
    const [options, setOptions] = useState<CountryOption[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(false);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoadingOptions(true);
                const res = await fetch(
                    '/api/admin/article-country?page=1&pageSize=9999',
                    {
                        cache: 'no-store',
                    }
                );
                const json = await res.json();
                const list = Array.isArray(json?.rows) ? json.rows : [];
                const opts: CountryOption[] = list.map((c: any) => ({
                    value: c.id,
                    label: c.nameZh || c.name || c.code || c.id,
                }));
                if (mounted) setOptions(opts);
            } catch (e) {
                toast({
                    title: '無法取得國家選項',
                    description: '稍後再試或重新整理頁面',
                    variant: 'destructive',
                });
            } finally {
                if (mounted) setLoadingOptions(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [toast]);

    // 兼容初始資料的不同格式，轉成 countryIds 陣列
    const initialCountryIds =
        initialData?.countryIds ??
        initialData?.countries?.map((c) => c.id) ??
        (initialData?.countryId ? [initialData.countryId] : []);

    const form = useForm<TravelArticleFormValues>({
        resolver: zodResolver(FormSchema),
        mode: 'onChange', // ✅ 即時驗證，搭配 isValid
        defaultValues: {
            title: initialData?.title ?? '',
            subtitle: initialData?.subtitle ?? '',
            linkUrl: initialData?.linkUrl ?? '',
            imageUrl: initialData?.imageUrl ?? '',
            countryIds: initialCountryIds ?? [],
        },
    });

    const { isValid, isSubmitting } = form.formState;

    const headingTitle = isEdit ? '編輯 典藏推薦' : '新增 典藏推薦';
    const headingDesc = isEdit
        ? '修改此文章內容並儲存。帶 * 為必填。'
        : '請填寫標題、連結、選擇國家並上傳圖片。帶 * 為必填。';
    const formId = 'travel-article-form';

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

    // 多選國家：只接受在 options 裡存在的 id（避免手打文字不是有效 id）
    const handleCountriesChange = (vals: string[]) => {
        const allowed = new Set(options.map((o) => o.value));
        const filtered = vals.filter((v) => allowed.has(v));
        if (filtered.length !== vals.length) {
            toast({
                title: '有些選項不是有效的國家',
                description:
                    '僅能選擇列表中的國家（若需新增國家，請先到國家管理建立）',
                variant: 'destructive',
            });
        }
        form.setValue('countryIds', filtered, { shouldValidate: true });
    };

    const onSubmit: SubmitHandler<TravelArticleFormValues> = (values) => {
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
                    // 提供 countryIds：整組覆蓋
                    res = await editArticle(id, {
                        title: values.title,
                        subtitle: values.subtitle,
                        linkUrl: values.linkUrl,
                        imageUrl: values.imageUrl,
                        countryIds: values.countryIds,
                    } as any);

                    if (!res?.error) {
                        // ✅ 失效列表 + 明細，回列表會自動 refetch
                        await Promise.all([
                            qc.invalidateQueries({
                                queryKey: ['travel-articles'],
                            }),
                            qc.invalidateQueries({ queryKey: KEYS.detail(id) }),
                        ]);
                    }
                } else {
                    res = await createArticle({
                        title: values.title,
                        subtitle: values.subtitle,
                        linkUrl: values.linkUrl,
                        imageUrl: values.imageUrl,
                        countryIds: values.countryIds,
                    } as any);

                    if (!res?.error) {
                        // ✅ 失效列表
                        qc.invalidateQueries({ queryKey: ['travel-articles'] });
                    }
                }

                if (res?.error) {
                    setError(res.error);
                } else {
                    setSuccess(
                        res?.success ?? (isEdit ? '更新成功' : '新增成功')
                    );
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
                                {/* 標題 */}
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
                                                    placeholder="例：東京自由行懶人包"
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

                                {/* 副標題 */}
                                <FormField
                                    control={form.control}
                                    name="subtitle"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="after:ml-1 after:text-rose-500 after:content-['*']">
                                                副標題
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="例：5 天 4 夜行程規劃"
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

                                {/* 連結 */}
                                <FormField
                                    control={form.control}
                                    name="linkUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="after:ml-1 after:text-rose-500 after:content-['*']">
                                                文章連結
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    inputMode="url"
                                                    placeholder="https://example.com/article/xxx"
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

                                {/* 國家：使用 CreatableMultiSelect（多選） */}
                                <FormField
                                    control={form.control}
                                    name="countryIds"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="after:ml-1 after:text-rose-500 after:content-['*']">
                                                國家
                                            </FormLabel>
                                            <FormControl>
                                                <CreatableMultiSelect
                                                    value={field.value}
                                                    onChange={
                                                        handleCountriesChange
                                                    }
                                                    options={options}
                                                    placeholder={
                                                        loadingOptions
                                                            ? '載入選項中…'
                                                            : '請選擇或輸入'
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
                                                htmlFor="upload-travel-article"
                                                className="group relative flex h-64 w-full cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-slate-50/60 transition hover:bg-slate-50"
                                            >
                                                <div className="absolute inset-0 pointer-events-none" />
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
                                                id="upload-travel-article"
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

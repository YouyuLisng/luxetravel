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
import { Switch } from '@/components/ui/switch';
import FormError from '@/components/auth/FormError';
import FormSuccess from '@/components/auth/FormSuccess';

import { useToast } from '@/hooks/use-toast';
import { useLoadingStore } from '@/stores/useLoadingStore';

import { createAirport, editAirport } from '@/app/admin/airport/action/airport';
import CreatableMultiSelect from '@/components/CreatableMultiSelect';

import { useQueryClient } from '@tanstack/react-query';
import { KEYS } from '@/features/airport/queries/airportQueries'; // ✅ 用於失效快取

type Option = { label: string; value: string };

// ======== 表單 Schema（單選：regionId、countryId）========
const FormSchema = z.object({
    code: z.string().trim().min(1, '請輸入機場代碼'),
    nameZh: z.string().trim().min(1, '請輸入中文名稱'),
    nameEn: z.string().trim().min(1, '請輸入英文名稱'),
    imageUrl: z.string().url('請輸入正確的圖片網址').optional().nullable(),
    enabled: z.boolean().default(true),
    regionId: z.string().trim().min(1, '請選擇地區'),
    countryId: z.string().trim().min(1, '請選擇國家'),
});

// 用「輸入型別」避免 RHF 與 resolver 不一致（enabled 允許省略）
type AirportFormValues = z.input<typeof FormSchema>;

interface Props {
    mode?: 'create' | 'edit';
    initialData?: Partial<AirportFormValues> & { id?: string };
}

export default function AirportForm({ mode = 'create', initialData }: Props) {
    const isEdit = mode === 'edit';
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const { show, hide } = useLoadingStore();
    const qc = useQueryClient();

    const page = searchParams.get('page') || '1';
    const pageSize = searchParams.get('pageSize') || '50';
    const q = searchParams.get('q') || '';
    const LIST_PATH = `/admin/airport?page=${page}&pageSize=${pageSize}&q=${q}`;

    const [isPending, startTransition] = useTransition();
    const [isLoading, setIsLoading] = useState(false);
    const [imgPreview, setImgPreview] = useState(initialData?.imageUrl ?? '');
    const [error, setError] = useState<string>();
    const [success, setSuccess] = useState<string>();

    // 下拉選項
    const [regionOptions, setRegionOptions] = useState<Option[]>([]);
    const [countryOptions, setCountryOptions] = useState<Option[]>([]);
    const [loadingRegions, setLoadingRegions] = useState(false);
    const [loadingCountries, setLoadingCountries] = useState(false);

    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                setLoadingRegions(true);
                const res = await fetch(
                    '/api/admin/regions?page=1&pageSize=9999',
                    {
                        cache: 'no-store',
                    }
                );
                const json = await res.json();
                const list = Array.isArray(json?.rows) ? json.rows : [];
                const opts: Option[] = list.map((r: any) => ({
                    value: r.id,
                    label: r.nameZh || r.nameEn || r.code || r.id,
                }));
                if (mounted) setRegionOptions(opts);
            } catch {
                toast({
                    title: '無法取得地區選項',
                    description: '請稍後再試或重新整理頁面',
                    variant: 'destructive',
                });
            } finally {
                if (mounted) setLoadingRegions(false);
            }
        })();

        (async () => {
            try {
                setLoadingCountries(true);
                const res = await fetch(
                    '/api/admin/countries?page=1&pageSize=9999',
                    {
                        cache: 'no-store',
                    }
                );
                const json = await res.json();
                const list = Array.isArray(json?.data) ? json.data : [];
                const opts: Option[] = list.map((c: any) => ({
                    value: c.id,
                    label: c.nameZh || c.nameEn || c.code || c.id,
                }));
                if (mounted) setCountryOptions(opts);
            } catch {
                toast({
                    title: '無法取得國家選項',
                    description: '請稍後再試或重新整理頁面',
                    variant: 'destructive',
                });
            } finally {
                if (mounted) setLoadingCountries(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [toast]);

    const form = useForm<AirportFormValues>({
        resolver: zodResolver(FormSchema),
        mode: 'onChange',
        defaultValues: {
            code: initialData?.code ?? '',
            nameZh: initialData?.nameZh ?? '',
            nameEn: initialData?.nameEn ?? '',
            imageUrl: initialData?.imageUrl ?? null, // 保持 string|null
            enabled: initialData?.enabled ?? true, // 這裡一定給 boolean
            regionId: initialData?.regionId ?? '',
            countryId: initialData?.countryId ?? '',
        },
    });

    const { isValid, isSubmitting } = form.formState;

    const headingTitle = isEdit ? '編輯機場' : '新增機場';
    const headingDesc = '請填寫相關資料。帶 * 為必填。';
    const formId = 'airport-form';

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

    // 單選：以 CreatableMultiSelect（多選元件）實作，但只取第一個值
    const handleSingleSelect =
        (fieldName: 'regionId' | 'countryId', options: Option[]) =>
        (vals: string[]) => {
            const allowed = new Set(options.map((o) => o.value));
            const filtered = vals.filter((v) => allowed.has(v));
            if (filtered.length !== vals.length) {
                toast({
                    title: '包含無效選項',
                    description:
                        '僅能選擇列表中的項目（若需新增，請到對應管理頁建立）',
                    variant: 'destructive',
                });
            }
            const first = filtered[0] ?? '';
            form.setValue(fieldName, first, { shouldValidate: true });
        };

    const onSubmit: SubmitHandler<AirportFormValues> = (values) => {
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
                    res = await editAirport(id, {
                        code: values.code,
                        nameZh: values.nameZh,
                        nameEn: values.nameEn,
                        imageUrl: values.imageUrl ?? null,
                        enabled: values.enabled ?? true,
                        regionId: values.regionId,
                        countryId: values.countryId,
                    } as any);

                    if (!res?.error) {
                        // ✅ 失效列表 + 明細，返回列表會自動重抓
                        await Promise.all([
                            qc.invalidateQueries({ queryKey: ['airports'] }),
                            qc.invalidateQueries({
                                queryKey: KEYS.detail(id!),
                            }),
                        ]);
                    }
                } else {
                    res = await createAirport({
                        code: values.code,
                        nameZh: values.nameZh,
                        nameEn: values.nameEn,
                        imageUrl: values.imageUrl ?? null,
                        enabled: values.enabled ?? true,
                        regionId: values.regionId,
                        countryId: values.countryId,
                    } as any);

                    if (!res?.error) {
                        qc.invalidateQueries({ queryKey: ['airports'] });
                    }
                }

                if (res?.error) {
                    setError(res.error);
                } else {
                    setSuccess(
                        res?.success ?? (isEdit ? '更新成功' : '新增成功')
                    );
                    router.replace(LIST_PATH);
                    router.refresh(); // 可選，確保路由層同步刷新
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
                            {isEdit ? '編輯機場' : '新增機場'}
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
                                {/* 代碼 */}
                                <FormField
                                    control={form.control}
                                    name="code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="after:ml-1 after:text-rose-500 after:content-['*']">
                                                機場代碼
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="例：NRT"
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
                                                    placeholder="例：成田國際機場"
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
                                                    placeholder="例：Narita International Airport"
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

                                {/* 地區（單選，用 CreatableMultiSelect） */}
                                <FormField
                                    control={form.control}
                                    name="regionId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="after:ml-1 after:text-rose-500 after:content-['*']">
                                                地區
                                            </FormLabel>
                                            <FormControl>
                                                <CreatableMultiSelect
                                                    value={
                                                        field.value
                                                            ? [field.value]
                                                            : []
                                                    }
                                                    onChange={handleSingleSelect(
                                                        'regionId',
                                                        regionOptions
                                                    )}
                                                    options={regionOptions}
                                                    placeholder={
                                                        loadingRegions
                                                            ? '載入選項中…'
                                                            : '選擇一個地區'
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* 國家（單選，用 CreatableMultiSelect） */}
                                <FormField
                                    control={form.control}
                                    name="countryId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="after:ml-1 after:text-rose-500 after:content-['*']">
                                                國家
                                            </FormLabel>
                                            <FormControl>
                                                <CreatableMultiSelect
                                                    value={
                                                        field.value
                                                            ? [field.value]
                                                            : []
                                                    }
                                                    onChange={handleSingleSelect(
                                                        'countryId',
                                                        countryOptions
                                                    )}
                                                    options={countryOptions}
                                                    placeholder={
                                                        loadingCountries
                                                            ? '載入選項中…'
                                                            : '選擇一個國家'
                                                    }
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
                                                htmlFor="upload-airport"
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
                                                id="upload-airport"
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

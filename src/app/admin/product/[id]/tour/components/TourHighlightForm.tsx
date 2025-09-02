'use client';

import {
    useState,
    useTransition,
    useCallback,
    ChangeEvent,
    useEffect,
} from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, X } from 'lucide-react';

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TextareaInput } from '@/components/TextareaInput';
import FormError from '@/components/auth/FormError';
import FormSuccess from '@/components/auth/FormSuccess';

import { useToast } from '@/hooks/use-toast';
import { useLoadingStore } from '@/stores/useLoadingStore';

import {
    TourHighlightCreateSchema,
    type TourHighlightCreateValues,
} from '@/schemas/tourHighlight';
import {
    createTourHighlights,
    editTourHighlights,
} from '@/app/admin/product/action/tourHighlight';

// === 型別 ===
export type TourHighlightFormValues = {
    highlights: TourHighlightCreateValues[];
};

interface Props {
    productId: string;
    initialData?: TourHighlightCreateValues[];
    method?: 'POST' | 'PUT';
    onChange?: (values: TourHighlightCreateValues[]) => void;
}

export default function TourHighlightForm({
    productId,
    initialData = [],
    method = 'POST',
    onChange,
}: Props) {
    const router = useRouter();
    const { toast } = useToast();
    const { show, hide } = useLoadingStore();

    const [isPending, startTransition] = useTransition();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>();
    const [success, setSuccess] = useState<string>();

    const form = useForm<TourHighlightFormValues>({
        resolver: zodResolver(
            TourHighlightCreateSchema.array().min(1, '至少要有一筆亮點')
        ) as any,
        mode: 'onChange',
        defaultValues: {
            highlights:
                initialData.length > 0
                    ? initialData
                    : [
                          {
                              productId,
                              imageUrl: '',
                              layout: 1,
                              title: '',
                              subtitle: '',
                              content: '',
                              order: 0,
                          },
                      ],
        },
    });

    const { control } = form;
    const { fields, append, remove } = useFieldArray({
        control,
        name: 'highlights',
    });

    const { isValid, isSubmitting } = form.formState;
    const formId = 'tour-highlight-form';
    const isEdit = method === 'PUT';

    // 👇 當表單值改變時，回傳給父層
    useEffect(() => {
        const subscription = form.watch((values) => {
            if (values?.highlights) {
                onChange?.(
                    values.highlights.filter(
                        (h): h is TourHighlightCreateValues => h !== undefined
                    )
                );
            }
        });
        return () => subscription.unsubscribe();
    }, [form, onChange]);

    // 圖片上傳
    const handleImageUpload = useCallback(
        async (file: File, index: number) => {
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

                form.setValue(`highlights.${index}.imageUrl`, url, {
                    shouldValidate: true,
                });

                toast({
                    title: '上傳成功',
                    description: '已更新圖片',
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
        index: number
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
        handleImageUpload(file, index);
    };

    const onSubmit = (values: TourHighlightFormValues) => {
        setError(undefined);
        setSuccess(undefined);

        startTransition(async () => {
            setIsLoading(true);
            show();
            try {
                let res: { error?: string; success?: string } | undefined;

                if (isEdit) {
                    const payload = values.highlights.map((h: any) => ({
                        id: h.id,
                        data: h,
                    }));
                    res = await editTourHighlights(payload as any);
                } else {
                    res = await createTourHighlights(values.highlights);
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
                    {/* Header */}
                    <div className="border-b border-slate-100 p-6">
                        <h2 className="text-xl font-semibold text-slate-900">
                            {isEdit ? '編輯行程亮點' : '行程亮點'}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            可新增多個亮點，帶 * 為必填。
                        </p>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        <form
                            id={formId}
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-6"
                        >
                            {fields.map((field, index) => (
                                <div
                                    key={field.id}
                                    className="border rounded-lg p-4 space-y-4 relative"
                                >
                                    {/* 刪除按鈕 */}
                                    <div className="absolute right-2 top-2">
                                        {fields.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                onClick={() => remove(index)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>

                                    {/* 圖片上傳 */}
                                    <FormField
                                        control={control}
                                        name={`highlights.${index}.imageUrl`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="after:ml-1 after:text-rose-500 after:content-['*']">
                                                    圖片
                                                </FormLabel>
                                                <label
                                                    htmlFor={`upload-highlight-${index}`}
                                                    className="group relative flex h-64 w-full cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-slate-50/60 transition hover:bg-slate-50"
                                                >
                                                    <div className="absolute inset-0 z-10" />
                                                    <div
                                                        className={`z-[3] flex flex-col items-center justify-center px-10 text-center ${
                                                            field.value
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
                                                    {field.value ? (
                                                        <Image
                                                            src={field.value}
                                                            alt="亮點圖片"
                                                            fill
                                                            className="rounded-xl object-contain bg-white"
                                                        />
                                                    ) : null}
                                                </label>

                                                <input
                                                    id={`upload-highlight-${index}`}
                                                    type="file"
                                                    className="hidden"
                                                    onChange={(e) =>
                                                        handleFileInput(
                                                            e,
                                                            index
                                                        )
                                                    }
                                                />

                                                <p className="text-xs text-slate-500">
                                                    支援單張圖片上傳（最大
                                                    50MB）。
                                                </p>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Layout */}
                                    <FormField
                                        control={control}
                                        name={`highlights.${index}.layout`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>版型</FormLabel>
                                                <Select
                                                    value={String(
                                                        field.value ?? 1
                                                    )}
                                                    onValueChange={(val) =>
                                                        field.onChange(
                                                            Number(val)
                                                        )
                                                    }
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="請選擇版型" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectGroup>
                                                            <SelectLabel>
                                                                版型
                                                            </SelectLabel>
                                                            <SelectItem value="1">
                                                                版型一
                                                            </SelectItem>
                                                            <SelectItem value="2">
                                                                版型二
                                                            </SelectItem>
                                                            <SelectItem value="3">
                                                                版型三
                                                            </SelectItem>
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Title */}
                                    <FormField
                                        control={control}
                                        name={`highlights.${index}.title`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="required">
                                                    標題
                                                </FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Subtitle */}
                                    <FormField
                                        control={control}
                                        name={`highlights.${index}.subtitle`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>副標題</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        value={
                                                            field.value ?? ''
                                                        }
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Content */}
                                    <FormField
                                        control={control}
                                        name={`highlights.${index}.content`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>內容</FormLabel>
                                                <FormControl>
                                                    <TextareaInput
                                                        rows={4}
                                                        {...field}
                                                        value={
                                                            field.value ?? ''
                                                        }
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Order */}
                                    <FormField
                                        control={control}
                                        name={`highlights.${index}.order`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="required">
                                                    排序
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            ))}

                            {/* 新增按鈕 (新增模式才顯示) */}
                            {!isEdit && (
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() =>
                                        append({
                                            productId,
                                            imageUrl: '',
                                            layout: 1,
                                            title: '',
                                            subtitle: '',
                                            content: '',
                                            order: fields.length,
                                        })
                                    }
                                    className="flex items-center gap-2"
                                >
                                    <Plus className="h-4 w-4" /> 新增亮點
                                </Button>
                            )}
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

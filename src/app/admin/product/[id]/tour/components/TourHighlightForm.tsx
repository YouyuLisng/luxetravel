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
import { Plus, X } from 'lucide-react';

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
    TourHighlightSchema,
    type TourHighlightValues,
} from '@/schemas/tourHighlight';
import { replaceTourHighlights } from '@/app/admin/product/action/tourHighlight';

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { z } from 'zod';

// === Schema ===
export const TourHighlightFormSchema = z.object({
    highlights: TourHighlightSchema.array().min(1, '至少要有一筆亮點'),
});
export type TourHighlightFormValues = z.infer<typeof TourHighlightFormSchema>;

interface Props {
    productId: string;
    initialData?: TourHighlightValues[];
}

export default function TourHighlightForm({
    productId,
    initialData = [],
}: Props) {
    const router = useRouter();
    const { toast } = useToast();
    const { show, hide } = useLoadingStore();

    const [isPending, startTransition] = useTransition();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>();
    const [success, setSuccess] = useState<string>();

    const form = useForm<TourHighlightFormValues>({
        resolver: zodResolver(TourHighlightFormSchema),
        mode: 'onChange',
        defaultValues: {
            highlights:
                initialData.length > 0
                    ? initialData
                    : [
                          {
                              productId,
                              layout: 1,
                              title: '',
                              subtitle: '',
                              content: '',
                              order: 0,
                              imageUrls: [''], // ✅ 預設至少一張空圖片，避免驗證失敗
                          },
                      ],
        },
    });

    const { control } = form;
    const { fields, append, remove } = useFieldArray({
        control,
        name: 'highlights',
    });

    const { isSubmitting } = form.formState;
    const formId = 'tour-highlight-form';

    // === 圖片上傳 ===
    const handleImageUpload = useCallback(
        async (file: File, highlightIndex: number, imageIndex: number) => {
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

                form.setValue(
                    `highlights.${highlightIndex}.imageUrls.${imageIndex}`,
                    url,
                    { shouldValidate: true }
                );

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
        highlightIndex: number,
        imageIndex: number
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
        handleImageUpload(file, highlightIndex, imageIndex);
    };

    // === 送出 ===
    const onSubmit = (values: TourHighlightFormValues) => {
        setError(undefined);
        setSuccess(undefined);
        console.log('onSubmit values:', values);
        startTransition(async () => {
            setIsLoading(true);
            show();
            try {
                const res = await replaceTourHighlights(
                    productId,
                    values.highlights
                );

                if (res?.error) {
                    setError(res.error);
                } else {
                    setSuccess(res?.success ?? '操作成功');
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
                            焦點特色
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            可新增多個亮點，每個亮點可包含多張圖片，帶 *
                            為必填。
                        </p>
                    </div>

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

                                    {/* 基本欄位 */}
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
                                                                版型一：兩張圖片靠右
                                                                - 16:9 橫式圖片
                                                            </SelectItem>
                                                            <SelectItem value="2">
                                                                版型二：滿版主圖輪播
                                                                - 16:9 橫式圖片
                                                            </SelectItem>
                                                            <SelectItem value="3">
                                                                版型三：兩張圖片靠左
                                                                - 16:9 橫式圖片
                                                            </SelectItem>
                                                            <SelectItem value="4">
                                                                版型四：三張圖 -
                                                                1:1 正方形圖片
                                                            </SelectItem>
                                                            {/* <SelectItem value="5">
                                                                版型五：每日行程中的景點輪播
                                                                - 9:16 直式圖片
                                                            </SelectItem> */}
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

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

                                    {/* 圖片設定 */}
                                    <Accordion
                                        type="single"
                                        collapsible
                                        defaultValue={`images-${index}`}
                                    >
                                        <AccordionItem
                                            value={`images-${index}`}
                                        >
                                            <AccordionTrigger>
                                                圖片設定
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <ImageFields
                                                    nestIndex={index}
                                                    control={control}
                                                    handleFileInput={
                                                        handleFileInput
                                                    }
                                                />
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                </div>
                            ))}

                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() =>
                                    append({
                                        productId,
                                        layout: 1,
                                        title: '',
                                        subtitle: '',
                                        content: '',
                                        order: fields.length,
                                        imageUrls: [''],
                                    })
                                }
                                className="flex items-center gap-2"
                            >
                                <Plus className="h-4 w-4" /> 新增亮點
                            </Button>

                            <FormError message={error} />
                            <FormSuccess message={success} />

                            <div className="flex justify-end gap-3">
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
                                        isLoading || isPending || isSubmitting
                                    }
                                >
                                    儲存亮點
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </Form>
    );
}

// === 子元件：ImageFields ===
function ImageFields({
    nestIndex,
    control,
    handleFileInput,
}: {
    nestIndex: number;
    control: any;
    handleFileInput: (
        e: ChangeEvent<HTMLInputElement>,
        highlightIndex: number,
        imageIndex: number
    ) => void;
}) {
    const { fields, append, remove } = useFieldArray({
        control,
        name: `highlights.${nestIndex}.imageUrls`,
    });

    // ✅ 確保至少有一筆
    useEffect(() => {
        if (fields.length === 0) {
            append('');
        }
    }, [fields, append]);

    return (
        <div className="space-y-6">
            {fields.map((field, imgIndex) => (
                <div key={field.id} className="border rounded-md p-6 relative">
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute right-4 top-2"
                        onClick={() => remove(imgIndex)}
                    >
                        <X className="h-4 w-4" />
                    </Button>

                    <FormField
                        control={control}
                        name={`highlights.${nestIndex}.imageUrls.${imgIndex}`}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="after:ml-1 after:text-rose-500 after:content-['*']">
                                    圖片
                                </FormLabel>
                                <label
                                    htmlFor={`upload-highlight-${nestIndex}-${imgIndex}`}
                                    className="group relative flex h-40 w-full cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-slate-50/60 transition hover:bg-slate-50"
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
                                    id={`upload-highlight-${nestIndex}-${imgIndex}`}
                                    type="file"
                                    className="hidden"
                                    onChange={(e) =>
                                        handleFileInput(e, nestIndex, imgIndex)
                                    }
                                />

                                <p className="text-xs text-slate-500">
                                    支援單張圖片上傳（最大 50MB）。
                                </p>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            ))}

            <Button
                className='bg-blue-600 text-white'
                type="button"
                variant="secondary"
                onClick={() => append('')}
            >
                <Plus className="h-4 w-4" /> 新增圖片
            </Button>
        </div>
    );
}

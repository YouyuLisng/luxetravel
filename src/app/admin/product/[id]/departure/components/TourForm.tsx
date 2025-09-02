'use client';

import React, { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { SubmitHandler, useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLoadingStore } from '@/stores/useLoadingStore';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'next/navigation';
import FormError from '@/components/auth/FormError';
import FormSuccess from '@/components/auth/FormSuccess';

import {
    ToursCreateSchema,
    type ToursCreateValues,
} from '@/schemas/tours';
import {
    createTours,
    editTours,
} from '@/app/admin/product/action/tour';
import { zhTW } from 'date-fns/locale';
import { TextareaInput } from '@/components/TextareaInput';

// ✅ 統一 Form 型別：id 可選
export type TourFormValues = ToursCreateValues & {
    id?: string;
};

type Props = {
    id?: string;
    initialData?: Partial<TourFormValues> & { id?: string };
    method?: 'POST' | 'PUT';
};

export default function TourForm({
    id,
    initialData,
    method = 'POST',
}: Props) {
    console.log('id', id);
    const LIST_PATH = `/admin/product/${id}/departure`;
    const router = useRouter();
    const searchParams = useSearchParams();
    const departDate = searchParams.get('departDate');
    const { show, hide } = useLoadingStore();
    const { toast } = useToast();

    const [isLoading, setIsLoading] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string>();
    const [success, setSuccess] = useState<string>();

    const isEdit = method === 'PUT' || Boolean(initialData?.id);
    const headingTitle = isEdit ? '編輯梯次' : '新增梯次';

    const form = useForm<TourFormValues>({
        resolver: zodResolver(ToursCreateSchema) as any,
        mode: 'onChange',
        defaultValues: {
            id: initialData?.id,
            productId: initialData?.productId ?? id,
            code: initialData?.code ?? '',
            departDate: initialData?.departDate
                ? new Date(initialData.departDate)
                : departDate
                  ? new Date(departDate)
                  : new Date(),
            returnDate: initialData?.returnDate
                ? new Date(initialData.returnDate)
                : new Date(),
            adult: initialData?.adult ?? 0,
            childWithBed: initialData?.childWithBed ?? 0,
            childNoBed: initialData?.childNoBed ?? 0,
            infant: initialData?.infant ?? 0,
            deposit: initialData?.deposit ?? '',
            status: initialData?.status ?? 1,
            note: initialData?.note ?? '',
            arrange: initialData?.arrange ?? '',
        },
    });
    const { isValid, isSubmitting } = form.formState;

    const onSubmit: SubmitHandler<TourFormValues> = (values) => {
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
                        toast({
                            variant: 'destructive',
                            title: '缺少編輯目標 ID',
                        });
                        return;
                    }
                    res = await editTours(id, values);
                } else {
                    res = await createTours(values);
                }

                if (res?.error) {
                    setError(res.error);
                    toast({
                        variant: 'destructive',
                        title: res.error,
                    });
                } else {
                    const msg =
                        res?.success ?? (isEdit ? '更新成功' : '新增成功');
                    setSuccess(msg);
                    toast({
                        title: msg,
                    });

                    router.replace(LIST_PATH);
                }
            } catch (err: any) {
                const msg = err?.message ?? (isEdit ? '更新失敗' : '新增失敗');
                setError(msg);
                toast({
                    variant: 'destructive',
                    title: msg,
                });
            } finally {
                setIsLoading(false);
                hide();
            }
        });
    };

    const formId = 'tourDeparture-form';

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
                            請填寫梯次基本資料，帶 * 為必填。
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
                            <div className="grid grid-cols-1 gap-6">
                                {/* 梯次代碼 */}
                                <FormField
                                    control={form.control}
                                    name="code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="required">
                                                梯次代碼
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="例：JP202509-01"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="departDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="required">
                                                出發日期
                                            </FormLabel>
                                            <div>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant="outline"
                                                                className={cn(
                                                                    'w-60 justify-between font-normal',
                                                                    !field.value &&
                                                                        'text-muted-foreground'
                                                                )}
                                                            >
                                                                {field.value
                                                                    ? new Date(
                                                                          field.value
                                                                      ).toLocaleDateString()
                                                                    : '選擇日期'}
                                                                <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent
                                                        className="w-auto p-0"
                                                        align="start"
                                                    >
                                                        <Calendar
                                                            mode="single"
                                                            locale={zhTW}
                                                            captionLayout="dropdown"
                                                            selected={
                                                                field.value
                                                                    ? new Date(
                                                                          field.value
                                                                      )
                                                                    : undefined
                                                            }
                                                            onSelect={(
                                                                date
                                                            ) => {
                                                                field.onChange(
                                                                    date
                                                                );
                                                            }}
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="returnDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="required">
                                                回程日期
                                            </FormLabel>
                                            <div>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant="outline"
                                                                className={cn(
                                                                    'w-60 justify-between font-normal',
                                                                    !field.value &&
                                                                        'text-muted-foreground'
                                                                )}
                                                            >
                                                                {field.value
                                                                    ? new Date(
                                                                          field.value
                                                                      ).toLocaleDateString()
                                                                    : '選擇日期'}
                                                                <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent
                                                        className="w-auto p-0"
                                                        align="start"
                                                    >
                                                        <Calendar
                                                            mode="single"
                                                            locale={zhTW}
                                                            captionLayout="dropdown"
                                                            selected={
                                                                field.value
                                                                    ? new Date(
                                                                          field.value
                                                                      )
                                                                    : undefined
                                                            }
                                                            onSelect={(
                                                                date
                                                            ) => {
                                                                field.onChange(
                                                                    date
                                                                );
                                                            }}
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* === 人數 & 費用 === */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <FormField
                                    control={form.control}
                                    name="adult"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>大人</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="text" // 🔥 改成 text
                                                    {...field}
                                                    value={field.value ?? ''} // 確保顯示字串
                                                    onChange={(e) => {
                                                        const val =
                                                            e.target.value;
                                                        // 如果是空字串就存 null 或 0，否則轉成 Number
                                                        field.onChange(
                                                            val === ''
                                                                ? ''
                                                                : Number(val)
                                                        );
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="childWithBed"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>兒童佔床</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="text"
                                                    {...field}
                                                    value={field.value ?? ''}
                                                    onChange={(e) => {
                                                        const val =
                                                            e.target.value;
                                                        field.onChange(
                                                            val === ''
                                                                ? ''
                                                                : Number(val)
                                                        );
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="childNoBed"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>兒童不佔床</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="text"
                                                    {...field}
                                                    value={field.value ?? ''}
                                                    onChange={(e) => {
                                                        const val =
                                                            e.target.value;
                                                        field.onChange(
                                                            val === ''
                                                                ? ''
                                                                : Number(val)
                                                        );
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="infant"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>嬰兒</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="text"
                                                    {...field}
                                                    value={field.value ?? ''}
                                                    onChange={(e) => {
                                                        const val =
                                                            e.target.value;
                                                        field.onChange(
                                                            val === ''
                                                                ? ''
                                                                : Number(val)
                                                        );
                                                    }}
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
                                        <FormLabel>訂金</FormLabel>
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

                            {/* 狀態 */}
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>狀態</FormLabel>
                                        <Select
                                            value={String(field.value ?? 1)}
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
                                                        開放報名
                                                    </SelectItem>
                                                    <SelectItem value="2">
                                                        已截止
                                                    </SelectItem>
                                                    <SelectItem value="3">
                                                        取消
                                                    </SelectItem>
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* 備註 & 行程安排 */}
                            <FormField
                                control={form.control}
                                name="note"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>備註</FormLabel>
                                        <FormControl>
                                            <TextareaInput
                                                rows={4}
                                                {...field}
                                                value={field.value ?? ''}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="arrange"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>行程安排</FormLabel>
                                        <FormControl>
                                            <TextareaInput
                                                rows={4}
                                                {...field}
                                                value={field.value ?? ''}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormError message={error} />
                            <FormSuccess message={success} />
                            {process.env.NODE_ENV === 'development' && (
                                <pre className="text-red-500 text-xs">
                                    {JSON.stringify(
                                        form.formState.errors,
                                        null,
                                        2
                                    )}
                                </pre>
                            )}
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
                            <Button type="submit" form={formId}>
                                {isEdit ? '儲存變更' : '送出需求'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </Form>
    );
}

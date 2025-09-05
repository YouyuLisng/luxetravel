'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { Calendar } from '@/components/ui/calendar';
import { zhTW } from 'date-fns/locale';
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { TextareaInput } from '@/components/TextareaInput';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLoadingStore } from '@/stores/useLoadingStore';
import FormError from '@/components/auth/FormError';
import FormSuccess from '@/components/auth/FormSuccess';

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import { TourSchema, type TourValues } from '@/schemas/tours';
import { replaceTours } from '@/app/admin/product/action/tour';

import { z } from 'zod';

export const TourFormSchema = TourSchema.omit({
    departDate: true,
    returnDate: true,
    code: true,
}).extend({
    dates: z.array(z.date()).min(1, '請至少選擇一個出發日期'),
});

export type TourFormValues = z.infer<typeof TourFormSchema>;

type Props = {
    productId: string;
    productCode: string;
    productDays: number;
    initialData?: TourValues[];
    initialDates?: Date[]; // 👈 新增，用來顯示已上架的日期
};

export default function TourForm({
    productId,
    productCode,
    productDays,
    initialData = [],
    initialDates = [],
}: Props) {
    const router = useRouter();
    const { toast } = useToast();
    const { show, hide } = useLoadingStore();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>();
    const [success, setSuccess] = useState<string>();
    const [isPending, startTransition] = useTransition();

    const defaultTour = initialData[0] ?? {
        productId,
        adult: 0,
        childWithBed: 0,
        childNoBed: 0,
        infant: 0,
        deposit: '',
        status: 1,
        note: '',
        arrangement: '',
    };

    const form = useForm<TourFormValues>({
        resolver: zodResolver(TourFormSchema),
        mode: 'onChange',
        defaultValues: {
            ...defaultTour,
            dates: initialDates, // 👈 預設勾選已有日期
        },
    });

    const { isSubmitting } = form.formState;

    // === 自動生成代碼 ===
    const generateCode = (productCode: string, date: Date, index: number) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${productCode}-${y}${m}${d}-${String(index + 1).padStart(2, '0')}`;
    };

    // === 送出 ===
    const onSubmit: SubmitHandler<TourFormValues> = async (values) => {
        setError(undefined);
        setSuccess(undefined);

        startTransition(async () => {
            setIsLoading(true);
            show();
            try {
                const tours: TourValues[] = values.dates.map((d, idx) => {
                    const departDate = new Date(d);
                    const returnDate = new Date(departDate);
                    returnDate.setDate(
                        returnDate.getDate() + (productDays - 1)
                    );

                    return {
                        productId,
                        code: generateCode(productCode, departDate, idx),
                        departDate,
                        returnDate,
                        adult: values.adult,
                        childWithBed: values.childWithBed,
                        childNoBed: values.childNoBed,
                        infant: values.infant,
                        deposit: values.deposit ?? null,
                        status: values.status,
                        note: values.note ?? null,
                        arrangement: values.arrangement ?? null,
                    };
                });

                const res = await replaceTours(productId, tours);

                if ('error' in res) {
                    setError(res.error);
                    toast({ variant: 'destructive', title: res.error });
                } else {
                    const msg = res.success ?? '梯次已更新成功';
                    setSuccess(msg);
                    toast({ title: msg });
                    router.refresh();
                }
            } catch (err: any) {
                const msg = err?.message ?? '梯次更新失敗';
                setError(msg);
                toast({ variant: 'destructive', title: msg });
            } finally {
                setIsLoading(false);
                hide();
            }
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 p-6">
                        <h2 className="text-xl font-semibold text-slate-900">
                            梯次設定
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            選擇多個日期，系統會自動建立梯次代碼與回程日。
                        </p>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* 多日期選擇 */}
                        <FormField
                            control={form.control}
                            name="dates"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="required">
                                        出發日期（可多選）
                                    </FormLabel>
                                    <Calendar
                                        mode="multiple"
                                        locale={zhTW}
                                        selected={field.value}
                                        onSelect={(dates) =>
                                            field.onChange(dates ?? [])
                                        }
                                        numberOfMonths={2} // 👈 雙月份
                                        pagedNavigation // 👈 讓翻頁一次翻兩個月
                                        className="rounded-md"
                                    />

                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* 人數設定 */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <FormField
                                control={form.control}
                                name="adult"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>大人</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                value={field.value ?? 0}
                                                onChange={(e) =>
                                                    field.onChange(
                                                        Number(e.target.value)
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
                                name="childWithBed"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>兒童佔床</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                value={field.value ?? 0}
                                                onChange={(e) =>
                                                    field.onChange(
                                                        Number(e.target.value)
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
                                name="childNoBed"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>兒童不佔床</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                value={field.value ?? 0}
                                                onChange={(e) =>
                                                    field.onChange(
                                                        Number(e.target.value)
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
                                name="infant"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>嬰兒</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                value={field.value ?? 0}
                                                onChange={(e) =>
                                                    field.onChange(
                                                        Number(e.target.value)
                                                    )
                                                }
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* 訂金 */}
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
                                                <SelectLabel>狀態</SelectLabel>
                                                <SelectItem value="1">
                                                    熱銷中
                                                </SelectItem>
                                                <SelectItem value="2">
                                                    已成團
                                                </SelectItem>
                                                <SelectItem value="3">
                                                    已滿團
                                                </SelectItem>
                                                <SelectItem value="4">
                                                    取消
                                                </SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* 備註 */}
                        <FormField
                            control={form.control}
                            name="note"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>備註</FormLabel>
                                    <FormControl>
                                        <TextareaInput
                                            rows={3}
                                            {...field}
                                            value={field.value ?? ''}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* 行程安排 */}
                        <FormField
                            control={form.control}
                            name="arrangement"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>行程安排</FormLabel>
                                    <FormControl>
                                        <TextareaInput
                                            rows={3}
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

                        <div className="flex justify-end pt-6">
                            <Button
                                type="submit"
                                disabled={isSubmitting || isLoading}
                            >
                                {isSubmitting || isLoading
                                    ? '儲存中...'
                                    : '儲存團體'}
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </Form>
    );
}

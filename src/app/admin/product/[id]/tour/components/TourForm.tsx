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

import {
    TourFormSchema,
    type TourFormValues,
    type TourValues,
} from '@/schemas/tours';
import { replaceTours } from '@/app/admin/product/action/tour';

export default function TourForm({
    productId,
    productCode,
    productDays,
    initialData = [],
    initialDates = [],
}: {
    productId: string;
    productCode: string;
    productDays: number;
    initialData?: TourValues[];
    initialDates?: Date[];
}) {
    const router = useRouter();
    const { toast } = useToast();
    const { show, hide } = useLoadingStore();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>();
    const [success, setSuccess] = useState<string>();
    const [isPending, startTransition] = useTransition();
    const defaultTour = initialData[0] ?? {
        productId,
        deposit: '',
        status: 1,
        note: '',
        arrangement: '',
    };

    const form = useForm<TourFormValues>({
        resolver: zodResolver(TourFormSchema),
        mode: 'onChange',
        defaultValues:
            initialData.length > 0
                ? {
                      productId,
                      dates: initialData.map((t) => new Date(t.departDate)),
                      prices: initialData.map((t) =>
                          'prices' in t
                              ? {
                                    adult: t.prices.adult,
                                    childWithBed: t.prices.childWithBed,
                                    childNoBed: t.prices.childNoBed,
                                    infant: t.prices.infant,
                                }
                              : {
                                    adult: (t as any).adult ?? 0,
                                    childWithBed: (t as any).childWithBed ?? 0,
                                    childNoBed: (t as any).childNoBed ?? 0,
                                    infant: (t as any).infant ?? 0,
                                }
                      ),
                      deposit: initialData[0]?.deposit ?? '',
                      status: initialData[0]?.status ?? 1,
                      note: initialData[0]?.note ?? '',
                      arrangement: initialData[0]?.arrangement ?? '',
                  }
                : {
                      productId,
                      dates: initialDates,
                      prices: initialDates.map(() => ({
                          adult: 0,
                          childWithBed: 0,
                          childNoBed: 0,
                          infant: 0,
                      })),
                      deposit: '',
                      status: 1,
                      note: '',
                      arrangement: '',
                  },
    });
    const { isSubmitting } = form.formState;

    // === 生成代碼 ===
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
                        prices: {
                            adult: values.prices[idx]?.adult ?? 0,
                            childWithBed: values.prices[idx]?.childWithBed ?? 0,
                            childNoBed: values.prices[idx]?.childNoBed ?? 0,
                            infant: values.prices[idx]?.infant ?? 0,
                        },
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
                            團體設定
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            選擇多個日期，系統會自動建立團體代碼與回程日，並可設定每個日期的價格。
                        </p>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* 日期選擇 */}
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
                                        onSelect={(dates) => {
                                            field.onChange(dates ?? []);
                                            form.setValue(
                                                'prices',
                                                (dates ?? []).map(() => ({
                                                    adult: 0,
                                                    childWithBed: 0,
                                                    childNoBed: 0,
                                                    infant: 0,
                                                }))
                                            );
                                        }}
                                        numberOfMonths={2}
                                        pagedNavigation
                                        className="rounded-md"
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* 表格輸入價格 */}
                        {form.watch('dates')?.length > 0 && (
                            <div className="overflow-x-auto">
                                <table className="min-w-full border border-slate-200 text-sm">
                                    <thead className="bg-slate-100">
                                        <tr>
                                            <th className="px-4 py-2 border">
                                                出發日期
                                            </th>
                                            <th className="px-4 py-2 border">
                                                大人價
                                            </th>
                                            <th className="px-4 py-2 border">
                                                兒童佔床價
                                            </th>
                                            <th className="px-4 py-2 border">
                                                兒童不佔床價
                                            </th>
                                            <th className="px-4 py-2 border">
                                                嬰兒價
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {form
                                            .watch('dates')
                                            .map(
                                                (date: Date, index: number) => {
                                                    const y =
                                                        date.getFullYear();
                                                    const m = String(
                                                        date.getMonth() + 1
                                                    ).padStart(2, '0');
                                                    const d = String(
                                                        date.getDate()
                                                    ).padStart(2, '0');
                                                    const dateStr = `${y}/${m}/${d}`;

                                                    return (
                                                        <tr
                                                            key={index}
                                                            className="text-center"
                                                        >
                                                            <td className="px-4 py-2 border">
                                                                {dateStr}
                                                            </td>
                                                            <td className="px-4 py-2 border">
                                                                <Input
                                                                    type="text"
                                                                    {...form.register(
                                                                        `prices.${index}.adult`,
                                                                        {
                                                                            setValueAs:
                                                                                (
                                                                                    v
                                                                                ) =>
                                                                                    v ===
                                                                                    ''
                                                                                        ? 0
                                                                                        : Number(
                                                                                              v
                                                                                          ),
                                                                        }
                                                                    )}
                                                                    className="w-24 text-right"
                                                                />
                                                            </td>
                                                            <td className="px-4 py-2 border">
                                                                <Input
                                                                    type="text"
                                                                    {...form.register(
                                                                        `prices.${index}.childWithBed`,
                                                                        {
                                                                            setValueAs:
                                                                                (
                                                                                    v
                                                                                ) =>
                                                                                    v ===
                                                                                    ''
                                                                                        ? 0
                                                                                        : Number(
                                                                                              v
                                                                                          ),
                                                                        }
                                                                    )}
                                                                    className="w-24 text-right"
                                                                />
                                                            </td>
                                                            <td className="px-4 py-2 border">
                                                                <Input
                                                                    type="text"
                                                                    {...form.register(
                                                                        `prices.${index}.childNoBed`,
                                                                        {
                                                                            setValueAs:
                                                                                (
                                                                                    v
                                                                                ) =>
                                                                                    v ===
                                                                                    ''
                                                                                        ? 0
                                                                                        : Number(
                                                                                              v
                                                                                          ),
                                                                        }
                                                                    )}
                                                                    className="w-24 text-right"
                                                                />
                                                            </td>
                                                            <td className="px-4 py-2 border">
                                                                <Input
                                                                    type="text"
                                                                    {...form.register(
                                                                        `prices.${index}.infant`,
                                                                        {
                                                                            setValueAs:
                                                                                (
                                                                                    v
                                                                                ) =>
                                                                                    v ===
                                                                                    ''
                                                                                        ? 0
                                                                                        : Number(
                                                                                              v
                                                                                          ),
                                                                        }
                                                                    )}
                                                                    className="w-24 text-right"
                                                                />
                                                            </td>
                                                        </tr>
                                                    );
                                                }
                                            )}
                                    </tbody>
                                </table>
                            </div>
                        )}

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

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

    // === 初始化 ===
    const form = useForm<TourFormValues>({
        resolver: zodResolver(TourFormSchema),
        mode: 'onChange',
        defaultValues:
            initialData.length > 0
                ? {
                      productId,
                      tours: initialData.map((t) => ({
                          date: new Date(t.departDate),
                          prices:
                              'prices' in t
                                  ? {
                                        adult: t.prices.adult ?? '',
                                        childWithBed:
                                            t.prices.childWithBed ?? '',
                                        childNoBed: t.prices.childNoBed ?? '',
                                        childExtraBed:
                                            (t.prices as any).childExtraBed ??
                                            '',
                                        infant: t.prices.infant ?? '',
                                    }
                                  : {
                                        adult: (t as any).adult ?? '',
                                        childWithBed:
                                            (t as any).childWithBed ?? '',
                                        childNoBed: (t as any).childNoBed ?? '',
                                        childExtraBed:
                                            (t as any).childExtraBed ?? '',
                                        infant: (t as any).infant ?? '',
                                    },
                          deposit: t.deposit ?? '',
                          status: t.status ?? 1,
                          note: t.note ?? '',
                      })),
                  }
                : {
                      productId,
                      tours:
                          initialDates.length > 0
                              ? initialDates.map((d) => ({
                                    date: d,
                                    prices: {
                                        adult: '',
                                        childWithBed: '',
                                        childNoBed: '',
                                        childExtraBed: '',
                                        infant: '',
                                    },
                                    deposit: '',
                                    status: 1,
                                    note: '',
                                }))
                              : [
                                    {
                                        date: new Date(),
                                        prices: {
                                            adult: '',
                                            childWithBed: '',
                                            childNoBed: '',
                                            childExtraBed: '',
                                            infant: '',
                                        },
                                        deposit: '',
                                        status: 1,
                                        note: '',
                                    },
                                ],
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
                const tours: TourValues[] = values.tours.map((tour, idx) => {
                    const departDate = new Date(tour.date);
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
                            adult: tour.prices.adult ?? '',
                            childWithBed: tour.prices.childWithBed ?? '',
                            childNoBed: tour.prices.childNoBed ?? '',
                            childExtraBed:
                                tour.prices.childExtraBed === ''
                                    ? 'NIL'
                                    : tour.prices.childExtraBed,
                            infant: tour.prices.infant ?? '',
                        },
                        deposit: tour.deposit ?? '',

                        status: tour.status,
                        note: tour.note === '' ? null : tour.note,
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
                            選擇多個日期，系統會自動建立團體代碼與回程日，並可設定每個日期的價格、加床、訂金、狀態與備註。
                            若未填寫價格，系統會回傳「NIL」表示無此報價。
                        </p>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* 日期選擇 */}
                        <FormField
                            control={form.control}
                            name="tours"
                            render={() => (
                                <FormItem>
                                    <FormLabel className="required">
                                        出發日期（可多選）
                                    </FormLabel>
                                    <Calendar
                                        mode="multiple"
                                        locale={zhTW}
                                        selected={form
                                            .watch('tours')
                                            .map((t) => t.date)}
                                        onSelect={(dates) => {
                                            const newTours =
                                                (dates ?? []).map((d, idx) => ({
                                                    date: d,
                                                    prices: form.watch(
                                                        `tours.${idx}.prices`
                                                    ) ?? {
                                                        adult: '',
                                                        childWithBed: '',
                                                        childNoBed: '',
                                                        childExtraBed: '',
                                                        infant: '',
                                                    },
                                                    deposit:
                                                        form.watch(
                                                            `tours.${idx}.deposit`
                                                        ) ?? '',
                                                    status:
                                                        form.watch(
                                                            `tours.${idx}.status`
                                                        ) ?? 1,
                                                    note:
                                                        form.watch(
                                                            `tours.${idx}.note`
                                                        ) ?? '',
                                                })) ?? [];
                                            form.setValue('tours', newTours);
                                        }}
                                        numberOfMonths={6}
                                        pagedNavigation
                                        className="rounded-md"
                                        disabled={{ before: new Date() }}
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* 表格 */}
                        {form.watch('tours')?.length > 0 && (
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
                                                加床價 <br />
                                                <span className="text-red-500">
                                                    (未填寫則系統會回傳無此報價)
                                                </span>
                                            </th>
                                            <th className="px-4 py-2 border">
                                                嬰兒價
                                            </th>
                                            <th className="px-4 py-2 border">
                                                訂金
                                            </th>
                                            <th className="px-4 py-2 border">
                                                狀態
                                            </th>
                                            <th className="px-4 py-2 border">
                                                備註
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {form
                                            .watch('tours')
                                            .map((tour, index) => {
                                                const date = tour.date;
                                                const y = date.getFullYear();
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
                                                                    `tours.${index}.prices.adult`
                                                                )}
                                                                className="text-right"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-2 border">
                                                            <Input
                                                                type="text"
                                                                {...form.register(
                                                                    `tours.${index}.prices.childWithBed`
                                                                )}
                                                                className="text-right"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-2 border">
                                                            <Input
                                                                type="text"
                                                                {...form.register(
                                                                    `tours.${index}.prices.childNoBed`
                                                                )}
                                                                className="text-right"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-2 border">
                                                            <div className="flex flex-col items-start">
                                                                <Input
                                                                    type="text"
                                                                    {...form.register(
                                                                        `tours.${index}.prices.childExtraBed`
                                                                    )}
                                                                    className="text-right"
                                                                />
                                                            </div>
                                                        </td>

                                                        <td className="px-4 py-2 border">
                                                            <Input
                                                                type="text"
                                                                {...form.register(
                                                                    `tours.${index}.prices.infant`
                                                                )}
                                                                className="text-right"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-2 border">
                                                            <Input
                                                                type="text"
                                                                {...form.register(
                                                                    `tours.${index}.deposit`
                                                                )}
                                                                className="text-right"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-2 border">
                                                            <Select
                                                                onValueChange={(
                                                                    val
                                                                ) =>
                                                                    form.setValue(
                                                                        `tours.${index}.status`,
                                                                        Number(
                                                                            val
                                                                        )
                                                                    )
                                                                }
                                                                value={String(
                                                                    tour.status
                                                                )}
                                                            >
                                                                <SelectTrigger className="w-28">
                                                                    <SelectValue placeholder="狀態" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectGroup>
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
                                                        </td>
                                                        <td className="px-4 py-2 border">
                                                            <TextareaInput
                                                                rows={2}
                                                                {...form.register(
                                                                    `tours.${index}.note`
                                                                )}
                                                                className="w-80 resize-none"
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                    </tbody>
                                </table>
                            </div>
                        )}

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

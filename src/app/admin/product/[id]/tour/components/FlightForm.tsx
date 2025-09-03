'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';

import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TextareaInput } from '@/components/TextareaInput';
import { useToast } from '@/hooks/use-toast';
import { useLoadingStore } from '@/stores/useLoadingStore';

import { FlightCreateSchema, type FlightCreateValues } from '@/schemas/flight';
import { createFlights, editFlights } from '@/app/admin/product/action/flight';
import { Plus, X } from 'lucide-react';

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

// 共用 hooks
import { useAirports } from '@/features/airport/queries/airportQueries';
import { useAirlines } from '@/features/airline/queries/airlineQueries';

// === 表單型別：陣列 ===
export type FlightFormValues = {
    flights: FlightCreateValues[];
};

type Props = {
    productId: string;
    initialData?: FlightCreateValues[];
    method?: 'POST' | 'PUT';
    onChange?: (values: FlightCreateValues[]) => void; // 👈 父層收集
};

export default function FlightForm({
    productId,
    initialData = [],
    method = 'POST',
    onChange,
}: Props) {
    const router = useRouter();
    const { toast } = useToast();
    const { show, hide } = useLoadingStore();

    const [isLoading, setIsLoading] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string>();
    const [success, setSuccess] = useState<string>();

    const { data: airports = [] } = useAirports();
    const { data: airlines = [] } = useAirlines();

    const form = useForm<FlightFormValues>({
        resolver: zodResolver(
            FlightCreateSchema.array().min(1, '至少要有一筆航班')
        ) as any,
        mode: 'onChange',
        defaultValues: {
            flights:
                initialData.length > 0
                    ? initialData
                    : [
                          {
                              productId,
                              departAirport: '',
                              departName: '',
                              arriveAirport: '',
                              arriveName: '',
                              departTime: '',
                              arriveTime: '',
                              duration: '',
                              crossDay: false,
                              airlineCode: '',
                              airlineName: '',
                              flightNo: '',
                              isTransit: false,
                              remark: '',
                          },
                      ],
        },
    });

    const { control } = form;
    const { fields, append, remove } = useFieldArray({
        control,
        name: 'flights',
    });

    const { isValid, isSubmitting } = form.formState;
    const formId = 'flight-form';
    const isEdit = method === 'PUT';

    // 👇 當表單值改變時，回傳給父層
    useEffect(() => {
        const subscription = form.watch((values) => {
            if (values?.flights) {
                const safeFlights = values.flights.filter(
                    (f): f is FlightCreateValues => f !== undefined
                );
                onChange?.(safeFlights);
            }
        });
        return () => subscription.unsubscribe();
    }, [form, onChange]);

    const onSubmit = (values: FlightFormValues) => {
        setError(undefined);
        setSuccess(undefined);

        startTransition(async () => {
            setIsLoading(true);
            show();
            try {
                let res: { error?: string; success?: string } | undefined;

                if (isEdit) {
                    // 批次更新，每筆都有 id
                    const payload = values.flights.map((f: any) => ({
                        id: f.id,
                        data: f,
                    }));
                    res = await editFlights(payload as any);
                } else {
                    // 建立
                    res = await createFlights(values.flights);
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
                    toast({ title: msg });
                    router.back();
                }
            } catch (err: any) {
                const msg = err?.message ?? (isEdit ? '更新失敗' : '新增失敗');
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
            <div className="mx-auto w-full">
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {/* Header */}
                    <div className="border-b border-slate-100 p-6">
                        <h2 className="text-xl font-semibold text-slate-900">
                            {isEdit ? '編輯航班' : '航班設定'}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            請填寫航班基本資料，帶 * 為必填。
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
                                    <div className="absolute right-2 top-2">
                                        {fields.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => remove(index)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>

                                    {/* 出發機場 */}
                                    <FormField
                                        control={control}
                                        name={`flights.${index}.departAirport`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="required">
                                                    出發機場
                                                </FormLabel>
                                                <Select
                                                    value={field.value ?? ''}
                                                    onValueChange={(val) => {
                                                        field.onChange(val);
                                                        const selected =
                                                            airports.find(
                                                                (a) =>
                                                                    a.code ===
                                                                    val
                                                            );
                                                        if (selected) {
                                                            form.setValue(
                                                                `flights.${index}.departName`,
                                                                selected.nameZh
                                                            );
                                                        }
                                                    }}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="選擇出發機場" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectGroup>
                                                            {airports.map(
                                                                (a) => (
                                                                    <SelectItem
                                                                        key={
                                                                            a.id
                                                                        }
                                                                        value={
                                                                            a.code
                                                                        }
                                                                    >
                                                                        {
                                                                            a.nameZh
                                                                        } (
                                                                        {
                                                                            a.code
                                                                        })
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
                                    <Input
                                        value={
                                            form.watch(
                                                `flights.${index}.departName`
                                            ) ?? ''
                                        }
                                        readOnly
                                        className="bg-slate-50"
                                    />

                                    {/* 抵達機場 */}
                                    <FormField
                                        control={control}
                                        name={`flights.${index}.arriveAirport`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="required">
                                                    抵達機場
                                                </FormLabel>
                                                <Select
                                                    value={field.value ?? ''}
                                                    onValueChange={(val) => {
                                                        field.onChange(val);
                                                        const selected =
                                                            airports.find(
                                                                (a) =>
                                                                    a.code ===
                                                                    val
                                                            );
                                                        if (selected) {
                                                            form.setValue(
                                                                `flights.${index}.arriveName`,
                                                                selected.nameZh
                                                            );
                                                        }
                                                    }}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="選擇抵達機場" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectGroup>
                                                            {airports.map(
                                                                (a) => (
                                                                    <SelectItem
                                                                        key={
                                                                            a.id
                                                                        }
                                                                        value={
                                                                            a.code
                                                                        }
                                                                    >
                                                                        {
                                                                            a.nameZh
                                                                        } (
                                                                        {
                                                                            a.code
                                                                        })
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
                                    <Input
                                        value={
                                            form.watch(
                                                `flights.${index}.arriveName`
                                            ) ?? ''
                                        }
                                        readOnly
                                        className="bg-slate-50"
                                    />

                                    {/* 航班號碼 & 航空公司 */}
                                    <FormField
                                        control={control}
                                        name={`flights.${index}.flightNo`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>航班號碼</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="例：JL802"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={control}
                                        name={`flights.${index}.airlineCode`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>航空公司</FormLabel>
                                                <Select
                                                    value={field.value ?? ''}
                                                    onValueChange={(val) => {
                                                        field.onChange(val);
                                                        const selected =
                                                            airlines.find(
                                                                (al) =>
                                                                    al.code ===
                                                                    val
                                                            );
                                                        if (selected) {
                                                            form.setValue(
                                                                `flights.${index}.airlineName`,
                                                                selected.nameZh
                                                            );
                                                        }
                                                    }}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="選擇航空公司" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectGroup>
                                                            {airlines.map(
                                                                (al) => (
                                                                    <SelectItem
                                                                        key={
                                                                            al.id
                                                                        }
                                                                        value={
                                                                            al.code
                                                                        }
                                                                    >
                                                                        {
                                                                            al.nameZh
                                                                        } (
                                                                        {
                                                                            al.code
                                                                        })
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
                                    <Input
                                        value={
                                            form.watch(
                                                `flights.${index}.airlineName`
                                            ) ?? ''
                                        }
                                        readOnly
                                        className="bg-slate-50"
                                    />

                                    {/* 起飛 / 抵達時間 */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={control}
                                            name={`flights.${index}.departTime`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        起飛時間
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            placeholder="例：08:00"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={control}
                                            name={`flights.${index}.arriveTime`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        抵達時間
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            placeholder="例：12:00"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Duration */}
                                    <FormField
                                        control={control}
                                        name={`flights.${index}.duration`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>飛行時間</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="例：4h"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* 備註 */}
                                    <FormField
                                        control={control}
                                        name={`flights.${index}.remark`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>備註</FormLabel>
                                                <FormControl>
                                                    <TextareaInput
                                                        rows={3}
                                                        {...field}
                                                        value={field.value ?? ''}
                                                        placeholder="請輸入航班備註"
                                                        disabled={
                                                            isPending ||
                                                            isLoading
                                                        }
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            ))}

                            {/* Add new flight */}
                            {!isEdit && (
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() =>
                                        append({
                                            productId,
                                            departAirport: '',
                                            departName: '',
                                            arriveAirport: '',
                                            arriveName: '',
                                            departTime: '',
                                            arriveTime: '',
                                            duration: '',
                                            crossDay: false,
                                            airlineCode: '',
                                            airlineName: '',
                                            flightNo: '',
                                            isTransit: false,
                                            remark: '',
                                        })
                                    }
                                >
                                    <Plus className="h-4 w-4" /> 新增航班
                                </Button>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </Form>
    );
}

'use client';

import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray, type SubmitHandler } from 'react-hook-form';

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

import { FlightFormSchema, type FlightFormValues } from '@/schemas/flight';
import { saveFlights } from '@/app/admin/product/action/flight';
import { Plus, X } from 'lucide-react';
import type { Resolver } from 'react-hook-form';

import { useAirports } from '@/features/airport/queries/airportQueries';
import { useAirlines } from '@/features/airline/queries/airlineQueries';
import { Combobox } from '@/components/combobox';

type Props = {
    productId: string;
    initialData?: FlightFormValues['flights'];
};

export default function FlightForm({ productId, initialData }: Props) {
    const { toast } = useToast();
    const { show, hide } = useLoadingStore();

    const [isLoading, setIsLoading] = useState(false);

    const { data: airports = [] } = useAirports();
    const { data: airlines = [] } = useAirlines();

    const defaultFlights =
        initialData && initialData.length > 0
            ? initialData
            : [
                  {
                      productId,
                      direction: 'OUTBOUND' as const,
                      day: undefined,
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
                  {
                      productId,
                      direction: 'RETURN' as const,
                      day: undefined,
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
              ];

    const form = useForm<FlightFormValues>({
        resolver: zodResolver(FlightFormSchema) as Resolver<FlightFormValues>,
        mode: 'onChange',
        defaultValues: {
            flights: defaultFlights,
        },
    });

    const { control } = form;
    const { fields, append, remove } = useFieldArray({
        control,
        name: 'flights',
    });

    const { isSubmitting } = form.formState;

    const onSubmit: SubmitHandler<FlightFormValues> = async (values) => {
        setIsLoading(true);
        show();
        try {
            const res = await saveFlights(productId, values.flights);
            if ('error' in res) {
                toast({ variant: 'destructive', title: res.error });
            } else {
                toast({ title: res.success ?? '航班已更新' });
            }
        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: err?.message ?? '航班儲存失敗',
            });
        } finally {
            setIsLoading(false);
            hide();
        }
    };

    const renderFlightSegment = (index: number) => (
        <div
            key={fields[index].id}
            className="border rounded-lg p-4 space-y-4 relative"
        >
            <div className="absolute right-2 top-2">
                <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => remove(index)}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* 出發機場 */}
            <FormField
                control={control}
                name={`flights.${index}.departAirport`}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="required">出發機場</FormLabel>
                        <FormControl>
                            <Combobox
                                options={(airports ?? []).map((a: any) => ({
                                    value: a.code,
                                    label: `${a.nameZh} ${a.nameEn ?? ''} (${a.code})`,
                                }))}
                                value={field.value ?? ''}
                                onChange={(val) => {
                                    field.onChange(val);
                                    const selected = airports.find(
                                        (a) => a.code === val
                                    );
                                    if (selected) {
                                        form.setValue(
                                            `flights.${index}.departName`,
                                            selected.nameZh
                                        );
                                    }
                                }}
                                placeholder="選擇出發機場"
                                searchPlaceholder="搜尋機場..."
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* 抵達機場 */}
            <FormField
                control={control}
                name={`flights.${index}.arriveAirport`}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="required">抵達機場</FormLabel>
                        <FormControl>
                            <Combobox
                                options={(airports ?? []).map((a: any) => ({
                                    value: a.code,
                                    label: `${a.nameZh} ${a.nameEn ?? ''} (${a.code})`,
                                }))}
                                value={field.value ?? ''}
                                onChange={(val) => {
                                    field.onChange(val);
                                    const selected = airports.find(
                                        (a) => a.code === val
                                    );
                                    if (selected) {
                                        form.setValue(
                                            `flights.${index}.arriveName`,
                                            selected.nameZh
                                        );
                                    }
                                }}
                                placeholder="選擇抵達機場"
                                searchPlaceholder="搜尋機場..."
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* 航空公司 */}
            <FormField
                control={control}
                name={`flights.${index}.airlineCode`}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>航空公司</FormLabel>
                        <FormControl>
                            <Combobox
                                options={(airlines ?? []).map((al: any) => ({
                                    value: al.code,
                                    label: `${al.nameZh} ${al.nameEn ?? ''} (${al.code})`,
                                }))}
                                value={field.value ?? ''}
                                onChange={(val) => {
                                    field.onChange(val);
                                    const selected = airlines.find(
                                        (al) => al.code === val
                                    );
                                    if (selected) {
                                        form.setValue(
                                            `flights.${index}.airlineName`,
                                            selected.nameZh
                                        );
                                    }
                                }}
                                placeholder="選擇航空公司"
                                searchPlaceholder="搜尋航空公司..."
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* 航班號碼 */}
            <FormField
                control={control}
                name={`flights.${index}.flightNo`}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>航班號碼</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="例：JL802" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* 起飛 / 抵達時間 */}
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={control}
                    name={`flights.${index}.departTime`}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>起飛時間</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    type="text"
                                    placeholder="19:55"
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
                            <FormLabel>抵達時間</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    type="text"
                                    placeholder="21:25"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            {/* 是否跨日 */}
            <FormField
                control={control}
                name={`flights.${index}.crossDay`}
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3">
                        <FormControl>
                            <input
                                type="checkbox"
                                checked={field.value ?? false}
                                onChange={(e) =>
                                    field.onChange(e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                            />
                        </FormControl>
                        <FormLabel className="!mt-0">是否跨日航班</FormLabel>
                    </FormItem>
                )}
            />

            {/* Day */}
            <FormField
                control={control}
                name={`flights.${index}.day`}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>航段天數</FormLabel>
                        <FormControl>
                            <Input
                                type="text"
                                value={field.value ?? ''}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    field.onChange(
                                        val === '' ? null : Number(val)
                                    );
                                }}
                                placeholder="例：1"
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* Duration */}
            <FormField
                control={control}
                name={`flights.${index}.duration`}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>飛行時間</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="例：4h" />
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
                                disabled={isSubmitting || isLoading}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <p className="mt-1 text-sm text-red-600">
                ※ 每個航段的備註會「分段落」，同時顯示在前端。例如設定四段航班，前端就會有四個分段落。
            </p>
        </div>
    );

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="mx-auto w-full">
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 p-6">
                            <h2 className="text-xl font-semibold text-slate-900">
                                航班設定
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                請填寫去程與回程航班，帶 * 為必填。
                            </p>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* 去程 */}
                                <div>
                                    <h3 className="font-bold text-lg my-4">
                                        去程航班
                                    </h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        {fields.map((f, index) =>
                                            f.direction === 'OUTBOUND'
                                                ? renderFlightSegment(index)
                                                : null
                                        )}
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() =>
                                                append({
                                                    productId,
                                                    direction: 'OUTBOUND',
                                                    day: undefined,
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
                                            <Plus className="h-4 w-4" />{' '}
                                            新增去程航班
                                        </Button>
                                    </div>
                                </div>

                                {/* 回程 */}
                                <div>
                                    <h3 className="font-bold text-lg my-4">
                                        回程航班
                                    </h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        {fields.map((f, index) =>
                                            f.direction === 'RETURN'
                                                ? renderFlightSegment(index)
                                                : null
                                        )}
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() =>
                                                append({
                                                    productId,
                                                    direction: 'RETURN',
                                                    day: undefined,
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
                                            <Plus className="h-4 w-4" />{' '}
                                            新增回程航班
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-6">
                                <Button type="submit">
                                    {isSubmitting || isLoading
                                        ? '儲存中...'
                                        : '儲存航班'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </Form>
    );
}

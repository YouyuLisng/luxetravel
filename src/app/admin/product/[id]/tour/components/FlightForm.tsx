'use client';

import React, { useState, useTransition, useEffect } from 'react';
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
import {
    saveFlights,
    getFlightsByProductId,
} from '@/app/admin/product/action/flight';
import { Plus, X } from 'lucide-react';

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import { useAirports } from '@/features/airport/queries/airportQueries';
import { useAirlines } from '@/features/airline/queries/airlineQueries';

// === 表單型別：陣列 ===
export type FlightFormValues = {
    flights: FlightCreateValues[];
};

type Props = {
    productId: string;
};

export default function FlightForm({ productId }: Props) {
    const { toast } = useToast();
    const { show, hide } = useLoadingStore();

    const [isLoading, setIsLoading] = useState(false);
    const [isPending, startTransition] = useTransition();

    const { data: airports = [] } = useAirports();
    const { data: airlines = [] } = useAirlines();

    const form = useForm<FlightFormValues>({
        resolver: zodResolver(
            FlightCreateSchema.array().min(2, '至少需要一筆去程與一筆回程航班')
        ) as any,
        mode: 'onChange',
        defaultValues: {
            flights: [
                {
                    productId,
                    direction: 'OUTBOUND',
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
                    direction: 'RETURN',
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

    // 初始化撈取資料
    useEffect(() => {
        async function fetchFlights() {
            const res = await getFlightsByProductId(productId);
            if ('data' in res && res.data && res.data.length > 0) {
                form.reset({ flights: res.data });
            }
        }
        if (productId) fetchFlights();
    }, [productId, form]);

    const onSubmit = (values: FlightFormValues) => {
        startTransition(async () => {
            setIsLoading(true);
            show();
            try {
                const res = await saveFlights(productId, values.flights);

                if ('error' in res) {
                    toast({ variant: 'destructive', title: res.error });
                } else {
                    toast({ title: res.success ?? '航班已更新' });
                    const refreshed = await getFlightsByProductId(productId);
                    if ('data' in refreshed && refreshed.data) {
                        form.reset({ flights: refreshed.data });
                    }
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
        });
    };

    // 分去程 / 回程
    const outboundFlights = fields.filter((f) => f.direction === 'OUTBOUND');
    const returnFlights = fields.filter((f) => f.direction === 'RETURN');

    const renderFlightSegment = (index: number) => (
        <div className="border rounded-lg p-4 space-y-4 relative">
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
                        <Select
                            value={field.value ?? ''}
                            onValueChange={(val) => {
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
                        >
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="選擇出發機場" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectGroup>
                                    {airports.map((a) => (
                                        <SelectItem key={a.id} value={a.code}>
                                            {a.nameZh} ({a.code})
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        <Input
                            value={
                                form.watch(`flights.${index}.departAirport`) ??
                                ''
                            }
                            readOnly
                            className="mt-2 bg-slate-50"
                        />
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
                        <Select
                            value={field.value ?? ''}
                            onValueChange={(val) => {
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
                        >
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="選擇抵達機場" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectGroup>
                                    {airports.map((a) => (
                                        <SelectItem key={a.id} value={a.code}>
                                            {a.nameZh} ({a.code})
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        <Input
                            value={
                                form.watch(`flights.${index}.arriveAirport`) ??
                                ''
                            }
                            readOnly
                            className="mt-2 bg-slate-50"
                        />
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
                        <Select
                            value={field.value ?? ''}
                            onValueChange={(val) => {
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
                        >
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="選擇航空公司" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectGroup>
                                    {airlines.map((al) => (
                                        <SelectItem key={al.id} value={al.code}>
                                            {al.nameZh} ({al.code})
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        <Input
                            value={
                                form.watch(`flights.${index}.airlineCode`) ?? ''
                            }
                            readOnly
                            className="mt-2 bg-slate-50"
                        />
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
                                <Input {...field} placeholder="例：08:00" />
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
                                <Input {...field} placeholder="例：12:00" />
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
                                disabled={isPending || isLoading}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );

    return (
        <Form {...form}>
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
                        <form
                            id={formId}
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-6"
                        >
                            <h3 className="font-bold text-lg">去程航班</h3>
                            {outboundFlights.map((f, idx) => (
                                <div key={f.id}>{renderFlightSegment(idx)}</div>
                            ))}
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() =>
                                    append({
                                        productId,
                                        direction: 'OUTBOUND',
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
                                <Plus className="h-4 w-4" /> 新增去程航班
                            </Button>

                            <h3 className="font-bold text-lg mt-8">回程航班</h3>
                            {returnFlights.map((f, idx) => (
                                <div key={f.id}>{renderFlightSegment(idx)}</div>
                            ))}
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() =>
                                    append({
                                        productId,
                                        direction: 'RETURN',
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
                                <Plus className="h-4 w-4" /> 新增回程航班
                            </Button>

                            <div className="flex justify-end pt-6">
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
                                    儲存航班
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </Form>
    );
}

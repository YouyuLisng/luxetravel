'use client';

import { useState, useTransition } from 'react';
import { useForm, useFieldArray, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { TextareaInput } from '@/components/TextareaInput';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Card } from '@/components/ui/card';
import FormError from '@/components/auth/FormError';
import FormSuccess from '@/components/auth/FormSuccess';

import { useToast } from '@/hooks/use-toast';
import { useLoadingStore } from '@/stores/useLoadingStore';

import {
    ItineraryCreateSchema,
    type ItineraryFormValues,
    type ItineraryCreateValues,
} from '@/schemas/itinerary';
import { replaceItineraries } from '@/app/admin/product/action/itinerary';
import { useAttractions } from '@/features/attraction/hooks/useAttraction';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import { X } from 'lucide-react';

interface Props {
    productId: string;
    initialData: ItineraryCreateValues[];
}

export default function ItineraryForm({ productId, initialData }: Props) {
    const router = useRouter();
    const { toast } = useToast();
    const { show, hide } = useLoadingStore();

    const { data } = useAttractions(1, 999);
    const attractions = data?.rows ?? [];

    const [isPending, startTransition] = useTransition();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>();
    const [success, setSuccess] = useState<string>();

    const form = useForm<ItineraryFormValues>({
        resolver: zodResolver(ItineraryCreateSchema),
        mode: 'onChange',
        defaultValues: {
            itineraries: initialData,
        },
    });

    const { control } = form;
    const { fields } = useFieldArray({ control, name: 'itineraries' });
    const { isValid, isSubmitting } = form.formState;
    const formId = 'itinerary-form';

    const onSubmit: SubmitHandler<ItineraryFormValues> = (values) => {
        setError(undefined);
        setSuccess(undefined);

        startTransition(async () => {
            setIsLoading(true);
            show();
            try {
                const res = await replaceItineraries(productId, {
                    itineraries: values.itineraries,
                });

                if (res?.error) {
                    setError(res.error);
                } else {
                    setSuccess(res?.success ?? '操作成功');
                    toast({ title: res?.success ?? '操作成功' });
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

    const visitTypeOptions = [
        { value: 'INSIDE', label: '入內參觀' },
        { value: 'OUTSIDE', label: '下車參觀' },
        { value: 'PHOTO', label: '拍照打卡' },
        { value: 'PASSBY', label: '車覽' },
    ];

    return (
        <Form {...form}>
            <form
                id={formId}
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
            >
                {fields.map((field, index) => (
                    <Card key={field.id} className="p-6 space-y-6 relative">
                        <h3 className="text-lg font-semibold">
                            Day {field.day}
                        </h3>

                        {/* 基本資訊 */}
                        <div className="grid grid-cols-2 gap-6">
                            <FormField
                                control={control}
                                name={`itineraries.${index}.title`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="required">
                                            標題
                                        </FormLabel>
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
                            <FormField
                                control={control}
                                name={`itineraries.${index}.subtitle`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>副標題</FormLabel>
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
                        </div>

                        <FormField
                            control={control}
                            name={`itineraries.${index}.content`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>內容</FormLabel>
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

                        {/* 餐食 & 住宿 */}
                        <div className="grid grid-cols-4 gap-4">
                            {['breakfast', 'lunch', 'dinner'].map((meal) => (
                                <FormField
                                    key={meal}
                                    control={control}
                                    name={`itineraries.${index}.${meal}` as any}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                {meal === 'breakfast'
                                                    ? '早餐'
                                                    : meal === 'lunch'
                                                      ? '午餐'
                                                      : '晚餐'}
                                            </FormLabel>
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
                            ))}
                            <FormField
                                control={control}
                                name={`itineraries.${index}.hotel`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>住宿</FormLabel>
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
                        </div>

                        {/* 備註 + 精選 */}
                        <div className="grid grid-cols-2 gap-6 items-center">
                            <FormField
                                control={control}
                                name={`itineraries.${index}.note`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>備註</FormLabel>
                                        <FormControl>
                                            <TextareaInput
                                                rows={2}
                                                {...field}
                                                value={field.value ?? ''}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={control}
                                name={`itineraries.${index}.featured`}
                                render={({ field }) => (
                                    <FormItem className="flex items-center space-x-2 mt-8">
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={(checked) =>
                                                field.onChange(!!checked)
                                            }
                                        />
                                        <FormLabel>精選</FormLabel>
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* 路線 (Accordion) */}
                        <Accordion type="single" collapsible>
                            <AccordionItem value="routes">
                                <AccordionTrigger>路線設定</AccordionTrigger>
                                <AccordionContent>
                                    <ItineraryRoutesField
                                        control={control}
                                        index={index}
                                    />
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>

                        {/* 景點 (Accordion) */}
                        <Accordion type="single" collapsible>
                            <AccordionItem value="attractions">
                                <AccordionTrigger>景點設定</AccordionTrigger>
                                <AccordionContent>
                                    <ItineraryAttractionsField
                                        control={control}
                                        index={index}
                                        attractions={attractions}
                                        visitTypeOptions={visitTypeOptions}
                                    />
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </Card>
                ))}

                <FormError message={error} />
                <FormSuccess message={success} />

                <div className="flex justify-end gap-3">
                    <Button
                        type="submit"
                        disabled={isSubmitting || isLoading || isPending}
                    >
                        儲存
                    </Button>
                </div>
            </form>
        </Form>
    );
}

/** 子元件：路線 */
function ItineraryRoutesField({
    control,
    index,
}: {
    control: any;
    index: number;
}) {
    const { fields, append, remove } = useFieldArray({
        control,
        name: `itineraries.${index}.routes`,
    });
    return (
        <div className="space-y-2">
            {fields.map((field, rIndex) => (
                <div
                    key={field.id}
                    className="relative border rounded-md p-3 grid grid-cols-4 gap-2 items-end"
                >
                    {['depart', 'arrive', 'duration', 'distance'].map((f) => (
                        <FormField
                            key={f}
                            control={control}
                            name={`itineraries.${index}.routes.${rIndex}.${f}`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {f === 'depart'
                                            ? '出發'
                                            : f === 'arrive'
                                              ? '抵達'
                                              : f === 'duration'
                                                ? '耗時'
                                                : '距離'}
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            value={field.value ?? ''}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    ))}

                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2 text-red-500 hover:text-red-700 bg-transparent"
                        onClick={() => remove(rIndex)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ))}
            <Button
                type="button"
                onClick={() =>
                    append({
                        depart: '',
                        arrive: '',
                        duration: '',
                        distance: '',
                    })
                }
            >
                新增路線
            </Button>
        </div>
    );
}

/** 子元件：景點 */
function ItineraryAttractionsField({
    control,
    index,
    attractions,
    visitTypeOptions,
}: {
    control: any;
    index: number;
    attractions: any[];
    visitTypeOptions: { value: string; label: string }[];
}) {
    const { fields, append, remove } = useFieldArray({
        control,
        name: `itineraries.${index}.attractions`,
    });
    return (
        <div className="space-y-2">
            {fields.map((field, aIndex) => (
                <div
                    key={field.id}
                    className="relative border rounded-md p-3 grid grid-cols-2 gap-2 items-end"
                >
                    {/* 景點選擇 */}
                    <FormField
                        control={control}
                        name={`itineraries.${index}.attractions.${aIndex}.attractionId`}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>景點</FormLabel>
                                <Select
                                    value={field.value ?? ''}
                                    onValueChange={(val) => field.onChange(val)}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="請選擇" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {attractions.map((a: any) => (
                                            <SelectItem key={a.id} value={a.id}>
                                                {a.nameZh}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )}
                    />
                    {/* 參觀方式 */}
                    <FormField
                        control={control}
                        name={`itineraries.${index}.attractions.${aIndex}.visitType`}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>參觀方式</FormLabel>
                                <Select
                                    value={field.value ?? ''}
                                    onValueChange={(val) => field.onChange(val)}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="請選擇" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {visitTypeOptions.map((opt: any) => (
                                            <SelectItem
                                                key={opt.value}
                                                value={opt.value}
                                            >
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )}
                    />

                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2 text-red-500 hover:text-red-700 bg-transparent"
                        onClick={() => remove(aIndex)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ))}
            <Button
                type="button"
                onClick={() =>
                    append({ attractionId: '', visitType: 'INSIDE' })
                }
            >
                新增景點
            </Button>
        </div>
    );
}

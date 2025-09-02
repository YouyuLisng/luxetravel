'use client';

import { useState, useTransition, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TextareaInput } from '@/components/TextareaInput';
import FormError from '@/components/auth/FormError';
import FormSuccess from '@/components/auth/FormSuccess';

import { useToast } from '@/hooks/use-toast';
import { useLoadingStore } from '@/stores/useLoadingStore';

import {
    ItineraryCreateSchema,
    type ItineraryCreateValues,
} from '@/schemas/itinerary';
import {
    editItineraries,
    createItineraries,
} from '@/app/admin/product/action/itinerary';

// === 型別 ===
export type ItineraryFormValues = {
    itineraries: ItineraryCreateValues[];
};

interface Props {
    productId: string;
    initialData: ItineraryCreateValues[];
    method?: 'POST' | 'PUT';
    onChange?: (values: ItineraryCreateValues[]) => void;
}

export default function ItineraryForm({
    productId,
    initialData,
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

    const form = useForm<ItineraryFormValues>({
        resolver: zodResolver(
            ItineraryCreateSchema.array().min(1, '至少要有一筆行程')
        ) as any,
        mode: 'onChange',
        defaultValues: {
            itineraries: initialData,
        },
    });

    const { control } = form;
    const { fields } = useFieldArray({
        control,
        name: 'itineraries',
    });

    const { isValid, isSubmitting } = form.formState;
    const formId = 'itinerary-form';
    const isEdit = method === 'PUT';

    // 👇 當表單值改變時，回傳給父層
    useEffect(() => {
        const subscription = form.watch((values) => {
            if (values?.itineraries) {
                onChange?.(
                    values.itineraries.filter(
                        (it): it is ItineraryCreateValues => it !== undefined
                    )
                );
            }
        });
        return () => subscription.unsubscribe();
    }, [form, onChange]);

    const onSubmit = (values: ItineraryFormValues) => {
        setError(undefined);
        setSuccess(undefined);

        startTransition(async () => {
            setIsLoading(true);
            show();
            try {
                let res: { error?: string; success?: string } | undefined;

                if (isEdit) {
                    const payload = values.itineraries.map((it: any) => ({
                        id: it.id,
                        data: it,
                    }));
                    res = await editItineraries(payload as any);
                } else {
                    res = await createItineraries(values.itineraries);
                }

                if (res?.error) {
                    setError(res.error);
                } else {
                    setSuccess(
                        res?.success ?? (isEdit ? '更新成功' : '新增成功')
                    );
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

    return (
        <Form {...form}>
            <div className="mx-auto w-full">
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {/* Header */}
                    <div className="border-b border-slate-100 p-6">
                        <h2 className="text-xl font-semibold text-slate-900">
                            {isEdit ? '編輯行程表' : '行程表'}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            每日行程（帶 * 為必填）。
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
                                    <h3 className="font-semibold">
                                        Day {field.day}
                                    </h3>

                                    {/* 標題 */}
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
                                                        value={
                                                            field.value ?? ''
                                                        }
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* 副標題 */}
                                    <FormField
                                        control={control}
                                        name={`itineraries.${index}.subtitle`}
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

                                    {/* 內容 */}
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
                                                        value={
                                                            field.value ?? ''
                                                        }
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* 三餐 */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <FormField
                                            control={control}
                                            name={`itineraries.${index}.breakfast`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>早餐</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            value={
                                                                field.value ??
                                                                ''
                                                            }
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={control}
                                            name={`itineraries.${index}.lunch`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>午餐</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            value={
                                                                field.value ??
                                                                ''
                                                            }
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={control}
                                            name={`itineraries.${index}.dinner`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>晚餐</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            value={
                                                                field.value ??
                                                                ''
                                                            }
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* 住宿 */}
                                    <FormField
                                        control={control}
                                        name={`itineraries.${index}.hotel`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>住宿</FormLabel>
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

                                    {/* 備註 */}
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
                                                        value={
                                                            field.value ?? ''
                                                        }
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            ))}

                            <FormError message={error} />
                            <FormSuccess message={success} />
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

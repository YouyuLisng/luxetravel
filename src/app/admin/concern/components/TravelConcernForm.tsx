'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { KEYS } from '@/features/travelConcern/queries/travelConcernQuery';

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
import FormError from '@/components/auth/FormError';
import FormSuccess from '@/components/auth/FormSuccess';

import {
    TravelConcernCreateSchema,
    TravelConcernEditSchema,
    type TravelConcernCreateValues,
    type TravelConcernEditValues,
} from '@/schemas/travelConcern';

import {
    createTravelConcern,
    editTravelConcern,
} from '@/app/admin/concern/action/travelConcern';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type TravelConcernFormValues = {
    moduleId?: string; // 新增時實際會被固定值覆蓋
    number: string; // '01' ~ '05'（隱藏欄位，依 order 自動生成）
    content: string;
    order: number; // 整數（用 Select 選）
};

interface Props {
    mode?: 'create' | 'edit';
    initialData?: Partial<TravelConcernFormValues> & { id?: string };
}

const FIXED_MODULE_ID = '68b04b1aeb0b7404083d887b';

export default function TravelConcernForm({
    mode = 'create',
    initialData,
}: Props) {
    const isEdit = mode === 'edit';
    const router = useRouter();
    const qc = useQueryClient();

    const searchParams = useSearchParams();
    const page = searchParams.get('page') || '1';
    const pageSize = searchParams.get('pageSize') || '50';
    const q = searchParams.get('q') || '';
    const LIST_PATH = `/admin/concern?page=${page}&pageSize=${pageSize}&q=${q}`;

    const [isPending, startTransition] = useTransition();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>();
    const [success, setSuccess] = useState<string>();

    // 預設 order 與 number（若沒提供，order=1、number='01'）
    const DEFAULT_ORDER =
        typeof initialData?.order === 'number' ? initialData.order : 1;
    const DEFAULT_NUMBER =
        initialData?.number ?? String(DEFAULT_ORDER).padStart(2, '0');

    const form = useForm<TravelConcernFormValues>({
        resolver: zodResolver(
            isEdit ? TravelConcernEditSchema : TravelConcernCreateSchema
        ) as any,
        mode: 'onChange',
        defaultValues: {
            moduleId: FIXED_MODULE_ID,
            number: DEFAULT_NUMBER,
            content: initialData?.content ?? '',
            order: DEFAULT_ORDER,
        },
    });

    const { isValid, isSubmitting } = form.formState;

    const formId = 'travel-concern-upsert-form';
    const headingTitle = isEdit
        ? '編輯 歐洲自由行規劃煩惱多? 卡片'
        : '新增 歐洲自由行規劃煩惱多? 卡片';
    const headingDesc = '請填寫相關資料。帶 * 為必填。';

    // 正規化：固定 moduleId、number 依 order 產生、order 轉數字
    const normalize = (v: TravelConcernFormValues): TravelConcernFormValues => {
        const ord =
            typeof v.order === 'number' ? v.order : Number(v.order || 0);
        return {
            ...v,
            moduleId: FIXED_MODULE_ID,
            number: String(ord).padStart(2, '0'),
            order: ord,
        };
    };

    const onSubmit = (values: TravelConcernFormValues) => {
        setError(undefined);
        setSuccess(undefined);

        startTransition(async () => {
            setIsLoading(true);
            try {
                const payload = normalize(values);

                if (isEdit) {
                    const id = initialData?.id;
                    if (!id) {
                        setError('缺少編輯目標 ID');
                        setIsLoading(false);
                        return;
                    }

                    const res = await editTravelConcern(id, {
                        number: payload.number,
                        content: payload.content,
                        order: payload.order,
                    } as TravelConcernEditValues);

                    if (res?.error) {
                        setError(res.error);
                    } else {
                        setSuccess(res?.success ?? '更新成功');
                        // 失效列表與這筆明細；返回列表自動重抓
                        await Promise.all([
                            await qc.invalidateQueries({
                                queryKey: ['concerns'],
                            }),
                            qc.invalidateQueries({ queryKey: KEYS.detail(id) }),
                        ]);
                        router.replace(LIST_PATH);
                        router.refresh(); // 可選
                    }
                } else {
                    const res = await createTravelConcern({
                        moduleId: FIXED_MODULE_ID,
                        number: payload.number,
                        content: payload.content,
                        order: payload.order,
                    } as TravelConcernCreateValues);

                    if (res?.error) {
                        setError(res.error);
                    } else {
                        setSuccess(res?.success ?? '新增成功');
                        await await qc.invalidateQueries({
                            queryKey: ['concerns'],
                        });
                        router.replace(LIST_PATH);
                        router.refresh(); // 可選
                    }
                }
            } catch (e: any) {
                setError(
                    e?.response?.data?.message ||
                        e?.message ||
                        (isEdit
                            ? '更新失敗，請稍後再試'
                            : '新增失敗，請稍後再試')
                );
            } finally {
                setIsLoading(false);
            }
        });
    };

    // 每當 order 改變，順便同步隱藏 number（'01'~'05'）
    const handleOrderChange = (value: string) => {
        const ord = Number(value);
        form.setValue('order', ord, { shouldValidate: true });
        form.setValue('number', String(ord).padStart(2, '0'), {
            shouldValidate: true,
        });
    };

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
                            {headingDesc}
                        </p>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <form
                            id={formId}
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-8"
                        >
                            <div className="grid grid-cols-1 gap-6">
                                {/* order（用 Select 選 1~5） */}
                                <FormField
                                    control={form.control}
                                    name="order"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="after:ml-1 after:text-rose-500 after:content-['*']">
                                                排序（1~5）
                                            </FormLabel>
                                            <FormControl>
                                                <Select
                                                    value={String(
                                                        field.value ?? ''
                                                    )}
                                                    onValueChange={(v) => {
                                                        field.onChange(
                                                            Number(v)
                                                        );
                                                        handleOrderChange(v);
                                                    }}
                                                    disabled={
                                                        isPending ||
                                                        isLoading ||
                                                        isSubmitting
                                                    }
                                                >
                                                    <SelectTrigger className="w-40">
                                                        <SelectValue placeholder="請選擇排序" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {[1, 2, 3, 4, 5].map(
                                                            (n) => (
                                                                <SelectItem
                                                                    key={n}
                                                                    value={String(
                                                                        n
                                                                    )}
                                                                >
                                                                    {n}
                                                                </SelectItem>
                                                            )
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* number：隱藏欄位，依 order 自動產生 '01'~'05' 供後端 Schema 驗證 */}
                                <FormField
                                    control={form.control}
                                    name="number"
                                    render={({ field }) => (
                                        <input type="hidden" {...field} />
                                    )}
                                />

                                {/* content */}
                                <FormField
                                    control={form.control}
                                    name="content"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="after:ml-1 after:text-rose-500 after:content-['*']">
                                                內容
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="請輸入內容"
                                                    disabled={
                                                        isPending ||
                                                        isLoading ||
                                                        isSubmitting
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormError message={error} />
                            <FormSuccess message={success} />
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
                    </div>
                </div>
            </div>
        </Form>
    );
}

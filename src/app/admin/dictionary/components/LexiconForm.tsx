'use client';

import React, { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import FormError from '@/components/auth/FormError';
import FormSuccess from '@/components/auth/FormSuccess';

import { useToast } from '@/hooks/use-toast';
import { useLoadingStore } from '@/stores/useLoadingStore';

import {
    createLexicon,
    editLexicon,
} from '@/app/admin/dictionary/action/dictionary';
import { useQueryClient } from '@tanstack/react-query';
import { KEYS } from '@/features/lexicon/queries/lexiconQueries';
import { TextareaInput } from '@/components/TextareaInput';

/* ========= Zod Schema ========= */
const FormSchema = z.object({
    title: z.string().trim().min(1, '請輸入標題'),
    type: z.string().trim().min(1, '請輸入類型'),
    context: z.string().trim().min(1, '請輸入內容'),
});

type LexiconFormValues = z.input<typeof FormSchema>;

interface Props {
    mode?: 'create' | 'edit';
    initialData?: Partial<LexiconFormValues> & { id?: string };
}

export default function LexiconForm({ mode = 'create', initialData }: Props) {
    const isEdit = mode === 'edit';
    const router = useRouter();
    const { toast } = useToast();
    const { show, hide } = useLoadingStore();
    const qc = useQueryClient();

    const searchParams = useSearchParams();
    const page = searchParams.get('page') || '1';
    const pageSize = searchParams.get('pageSize') || '50';
    const q = searchParams.get('q') || '';
    const LIST_PATH = `/admin/dictionary?page=${page}&pageSize=${pageSize}&q=${q}`;

    const [isPending, startTransition] = useTransition();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>();
    const [success, setSuccess] = useState<string>();

    const form = useForm<LexiconFormValues>({
        resolver: zodResolver(FormSchema),
        mode: 'onChange',
        defaultValues: {
            title: initialData?.title ?? '',
            type: initialData?.type ?? '',
            context: initialData?.context ?? '',
        },
    });

    const { isValid, isSubmitting } = form.formState;

    const headingTitle = isEdit ? '編輯詞條' : '新增詞條';
    const formId = 'lexicon-form';

    const onSubmit: SubmitHandler<LexiconFormValues> = (values) => {
        setError(undefined);
        setSuccess(undefined);

        startTransition(async () => {
            setIsLoading(true);
            show();
            try {
                let res: { error?: string; success?: string } | undefined;

                if (isEdit) {
                    const id = initialData?.id;
                    if (!id) {
                        setError('缺少編輯目標 ID');
                        setIsLoading(false);
                        hide();
                        return;
                    }

                    res = await editLexicon(id, {
                        ...values,
                        id,
                    });

                    if (!res?.error) {
                        await Promise.all([
                            qc.invalidateQueries({ queryKey: ['lexicons'] }),
                            qc.invalidateQueries({ queryKey: KEYS.detail(id) }),
                        ]);
                    }
                } else {
                    res = await createLexicon(values); // create 不需要 id
                    if (!res?.error) {
                        await qc.invalidateQueries({ queryKey: ['lexicons'] });
                    }
                }

                if (res?.error) {
                    setError(res.error);
                } else {
                    setSuccess(
                        res?.success ?? (isEdit ? '更新成功' : '新增成功')
                    );
                    router.replace(LIST_PATH);
                    router.refresh();
                }
            } catch (e: any) {
                setError(
                    e?.message ??
                        (isEdit
                            ? '更新失敗，請稍後再試'
                            : '新增失敗，請稍後再試')
                );
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
                            {headingTitle}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            請填寫相關資料。帶 * 為必填。
                        </p>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <form
                            id={formId}
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-6"
                        >
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="required">
                                            標題
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="例：常用詞條"
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

                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="required">
                                            類型
                                        </FormLabel>
                                        <FormControl>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                                disabled={
                                                    isPending ||
                                                    isLoading ||
                                                    isSubmitting
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="請選擇類型" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="參團須知">
                                                        參團須知
                                                    </SelectItem>
                                                    <SelectItem value="貼心提醒">
                                                        貼心提醒
                                                    </SelectItem>
                                                    <SelectItem value="備註">
                                                        備註
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="context"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="required">
                                            內容
                                        </FormLabel>
                                        <FormControl>
                                            <TextareaInput
                                                {...field}
                                                className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                placeholder="請輸入景點介紹內容"
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

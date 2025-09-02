// app/(admin)/admin/testimonial/components/TestimonialForm.tsx
'use client';

import React, { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
    Form,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
    FormField,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import FormError from '@/components/auth/FormError';
import FormSuccess from '@/components/auth/FormSuccess';

import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select';

import { useToast } from '@/hooks/use-toast';
import { useLoadingStore } from '@/stores/useLoadingStore';
import { useQueryClient } from '@tanstack/react-query';
import { KEYS } from '@/features/testimonial/queries/testimonialQueries';
import {
    createTestimonial,
    editTestimonial,
} from '@/app/admin/testimonial/action/testimonial';

const LIST_PATH = '/admin/testimonial';

/* -------------------- Zod form schema (client) -------------------- */
const FormSchema = z.object({
    mode: z.enum(['REAL', 'MARKETING'], { required_error: '請選擇來源類型' }),
    nickname: z.string().trim().optional().nullable(),
    // 允許空值；若有值須為 1~5 的整數
    stars: z
        .preprocess(
            (v) =>
                v === '' || v === null || v === undefined ? null : Number(v),
            z
                .number()
                .int()
                .min(1, '最少 1 顆星')
                .max(5, '最多 5 顆星')
                .nullable()
        )
        .optional(),
    content: z.string().trim().min(1, '請輸入內容'),
    linkUrl: z.string().trim().url('請輸入正確的網址').optional().nullable(),
    order: z.preprocess(
        (v) => (v === '' || v === null || v === undefined ? 0 : Number(v)),
        z.number().int().min(0, '排序不可小於 0')
    ),
});

type TestimonialFormValues = z.infer<typeof FormSchema>;

interface Props {
    initialData?: Partial<TestimonialFormValues> & { id?: string };
    method?: 'POST' | 'PUT';
}

export default function TestimonialForm({
    initialData,
    method = 'POST',
}: Props) {
    const isEdit = method === 'PUT' || Boolean(initialData?.id);

    const router = useRouter();
    const { toast } = useToast();
    const { show, hide } = useLoadingStore();
    const qc = useQueryClient();

    const [error, setError] = useState<string>();
    const [success, setSuccess] = useState<string>();
    const [isPending, startTransition] = useTransition();

    const form = useForm<TestimonialFormValues>({
        // 關鍵：避免 z.preprocess 造成的泛型不相容編譯錯誤
        resolver: zodResolver(FormSchema) as any,
        mode: 'onChange',
        defaultValues: {
            mode: (initialData?.mode as 'REAL' | 'MARKETING') ?? 'REAL',
            nickname: initialData?.nickname ?? '',
            stars:
                initialData?.stars === undefined || initialData?.stars === null
                    ? null
                    : Number(initialData.stars),
            content: initialData?.content ?? '',
            linkUrl: (initialData?.linkUrl as string | null) ?? null,
            order:
                typeof initialData?.order === 'number'
                    ? (initialData.order as number)
                    : 0,
        },
    });

    const { isValid, isSubmitting } = form.formState;

    // 將空字串正規化成 null，符合 Server Action 預期
    function normalize(v: TestimonialFormValues) {
        return {
            mode: v.mode,
            content: v.content,
            order: typeof v.order === 'number' ? v.order : 0,
            nickname: v.nickname ? v.nickname : null,
            stars: v.stars ?? null,
            linkUrl: v.linkUrl ? v.linkUrl : null,
        };
    }

    const onSubmit: SubmitHandler<TestimonialFormValues> = (values) => {
        setError(undefined);
        setSuccess(undefined);

        startTransition(async () => {
            show();
            try {
                const payload = normalize(values);
                let res:
                    | { error?: string; success?: string; data?: unknown }
                    | undefined;

                if (isEdit) {
                    const id = initialData?.id;
                    if (!id) {
                        setError('缺少編輯目標 ID');
                        hide();
                        return;
                    }
                    res = await editTestimonial(id, payload);
                } else {
                    res = await createTestimonial(payload);
                }

                if (res?.error) {
                    setError(res.error);
                } else {
                    setSuccess(
                        res?.success ?? (isEdit ? '更新成功' : '新增成功')
                    );

                    // 失效快取 → 返回列表
                    await qc.invalidateQueries({ queryKey: KEYS.list() });
                    if (isEdit && initialData?.id) {
                        await qc.invalidateQueries({
                            queryKey: KEYS.detail(initialData.id),
                        });
                    }
                    router.replace(LIST_PATH);
                }
            } catch (e: any) {
                setError(e?.message ?? (isEdit ? '更新失敗' : '新增失敗'));
            } finally {
                hide();
            }
        });
    };

    const formId = 'testimonial-form';

    return (
        <Form {...form}>
            <div className="mx-auto w-full">
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {/* Header */}
                    <div className="border-b border-slate-100 p-6">
                        <h2 className="text-xl font-semibold text-slate-900">
                            {isEdit ? '編輯 Testimonial' : '新增 Testimonial'}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            {isEdit
                                ? '修改此評價內容並儲存。帶 * 為必填。'
                                : '請填寫評價內容與相關資訊。帶 * 為必填。'}
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
                                {/* 來源類型 */}
                                <FormField
                                    control={form.control}
                                    name="mode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="after:ml-1 after:text-rose-500 after:content-['*']">
                                                來源類型
                                            </FormLabel>
                                            <FormControl>
                                                <Select
                                                    value={field.value}
                                                    onValueChange={(v) =>
                                                        field.onChange(
                                                            v as
                                                                | 'REAL'
                                                                | 'MARKETING'
                                                        )
                                                    }
                                                    disabled={
                                                        isPending ||
                                                        isSubmitting
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="請選擇" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="REAL">
                                                            REAL（真實旅客）
                                                        </SelectItem>
                                                        <SelectItem value="MARKETING">
                                                            MARKETING（行銷文案）
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* 暱稱（選填） */}
                                <FormField
                                    control={form.control}
                                    name="nickname"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>暱稱（選填）</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    value={field.value ?? ''}
                                                    onChange={(e) =>
                                                        field.onChange(
                                                            e.target.value ||
                                                                null
                                                        )
                                                    }
                                                    placeholder="例：小明"
                                                    disabled={
                                                        isPending ||
                                                        isSubmitting
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* 星等（選填 1~5） */}
                                <FormField
                                    control={form.control}
                                    name="stars"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                星等（選填，1~5）
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    max={5}
                                                    value={field.value ?? ''}
                                                    onChange={(e) => {
                                                        const v =
                                                            e.target.value;
                                                        field.onChange(
                                                            v === ''
                                                                ? null
                                                                : Number(v)
                                                        );
                                                    }}
                                                    placeholder="1 ~ 5"
                                                    disabled={
                                                        isPending ||
                                                        isSubmitting
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* 內容 */}
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
                                                    placeholder="請輸入評價內容"
                                                    disabled={
                                                        isPending ||
                                                        isSubmitting
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* 連結（選填） */}
                                <FormField
                                    control={form.control}
                                    name="linkUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>連結（選填）</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    inputMode="url"
                                                    value={field.value ?? ''}
                                                    onChange={(e) =>
                                                        field.onChange(
                                                            e.target.value ||
                                                                null
                                                        )
                                                    }
                                                    placeholder="https://example.com/post/xxx"
                                                    disabled={
                                                        isPending ||
                                                        isSubmitting
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* 排序 */}
                                <FormField
                                    control={form.control}
                                    name="order"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="after:ml-1 after:text-rose-500 after:content-['*']">
                                                排序
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    value={field.value ?? 0}
                                                    onChange={(e) =>
                                                        field.onChange(
                                                            Number(
                                                                e.target.value
                                                            )
                                                        )
                                                    }
                                                    placeholder="0"
                                                    disabled={
                                                        isPending ||
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
                                disabled={isPending || isSubmitting}
                            >
                                取消
                            </Button>
                            <Button
                                type="submit"
                                form={formId}
                                disabled={!isValid || isPending || isSubmitting}
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

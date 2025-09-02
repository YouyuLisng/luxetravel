// app/(admin)/admin/modules/components/ModuleForm.tsx
'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import FormError from '@/components/auth/FormError';
import FormSuccess from '@/components/auth/FormSuccess';

import { createModule, editModule } from '@/app/admin/modules/action/Module';
import {
    ModuleCreateSchema,
    ModuleEditSchema,
    type ModuleCreateValues,
    type ModuleEditValues,
} from '@/schemas/module';

const LIST_PATH = '/admin/modules';

/** 統一前端表單型別，避免 union 造成 resolver/Control 型別不相容 */
type ModuleFormValues = {
    key?: string;
    title: string;
    subtitle: string | null;
    type?: 'ADVANTAGE' | 'CONCERN';
};

interface Props {
    /** 新增（預設）或編輯 */
    mode?: 'create' | 'edit';
    /** 編輯時傳入的初始資料與 id */
    initialData?: Partial<ModuleFormValues> & { id?: string };
}

export default function ModuleForm({ mode = 'create', initialData }: Props) {
    const isEdit = mode === 'edit';
    const router = useRouter();

    const [isPending, startTransition] = useTransition();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>();
    const [success, setSuccess] = useState<string>();

    const form = useForm<ModuleFormValues>({
        // ✅ 驗證模式使用 onChange，配合 disabled={!isValid}
        mode: 'onChange',
        // 編輯用 ModuleEditSchema；新增用 ModuleCreateSchema
        resolver: zodResolver(
            isEdit ? ModuleEditSchema : ModuleCreateSchema
        ) as any,
        defaultValues: {
            key: initialData?.key ?? '',
            title: initialData?.title ?? '',
            subtitle: (initialData?.subtitle as string | null) ?? null,
            type: (initialData?.type as ModuleFormValues['type']) ?? undefined,
        },
    });

    // ✅ 取出狀態，修正 isSubmitting / isValid 未定義問題
    const { isValid, isSubmitting } = form.formState;

    const formId = 'module-upsert-form';
    const headingTitle = isEdit ? '編輯模組（Module）' : '新增模組（Module）';
    const headingDesc = isEdit
        ? '僅可修改標題與副標題（key / type 不建議變更）。帶 * 為必填。'
        : '請填寫 Key、標題、類型。帶 * 為必填。';

    // 正規化：key → 小寫；subtitle 空字串 → null
    const normalize = (v: ModuleFormValues): ModuleFormValues => ({
        ...v,
        key: v.key?.toLowerCase(),
        subtitle: v.subtitle === '' ? null : (v.subtitle ?? null),
    });

    const onSubmit = (values: ModuleFormValues) => {
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

                    const res = await editModule(id, {
                        title: payload.title,
                        subtitle: payload.subtitle,
                    } as ModuleEditValues);

                    if (res?.error) {
                        setError(res.error);
                    } else {
                        setSuccess(res?.success ?? '更新成功');
                        // ✅ 統一回列表頁
                        router.replace(LIST_PATH);
                    }
                } else {
                    const res = await createModule({
                        key: payload.key || '',
                        title: payload.title,
                        subtitle: payload.subtitle,
                        type: payload.type as ModuleCreateValues['type'],
                    });

                    if (res?.error) {
                        setError(res.error);
                    } else {
                        setSuccess(res?.success ?? '新增成功');
                        // ✅ 統一回列表頁（不再 reset，因為要導頁）
                        router.replace(LIST_PATH);
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
                                {/* Key（僅新增顯示） */}
                                {!isEdit && (
                                    <FormField
                                        control={form.control}
                                        name="key"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="after:ml-1 after:text-rose-500 after:content-['*']">
                                                    Key
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="例：travel_concern"
                                                        onChange={(e) =>
                                                            field.onChange(
                                                                e.target.value.toLowerCase()
                                                            )
                                                        }
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
                                )}

                                {/* 標題 */}
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="after:ml-1 after:text-rose-500 after:content-['*']">
                                                標題
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="例：歐洲自由行煩惱多？"
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

                                {/* 副標題（選填） */}
                                <FormField
                                    control={form.control}
                                    name="subtitle"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                副標題（選填）
                                            </FormLabel>
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
                                                    placeholder="例：解決你的旅程痛點"
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

                                {/* 類型（僅新增顯示） */}
                                {!isEdit && (
                                    <FormField
                                        control={form.control}
                                        name="type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="after:ml-1 after:text-rose-500 after:content-['*']">
                                                    類型
                                                </FormLabel>
                                                <FormControl>
                                                    <Select
                                                        value={field.value}
                                                        onValueChange={(v) =>
                                                            field.onChange(v)
                                                        }
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
                                                            <SelectItem value="ADVANTAGE">
                                                                ADVANTAGE（優勢）
                                                            </SelectItem>
                                                            <SelectItem value="CONCERN">
                                                                CONCERN（煩惱）
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
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
                                // ✅ 表單驗證未通過時，不允許送出
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

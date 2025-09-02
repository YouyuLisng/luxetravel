// src/app/admin/users/components/UserForm.tsx
'use client';

import React, {
    ChangeEvent,
    useCallback,
    useState,
    useTransition,
} from 'react';
import { useRouter } from 'next/navigation';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SubmitHandler, useForm, type Resolver } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

import { useLoadingStore } from '@/stores/useLoadingStore';
import { useToast } from '@/hooks/use-toast';

import FormError from '@/components/auth/FormError';
import FormSuccess from '@/components/auth/FormSuccess';

// ✅ Schemas
import {
    UserCreateSchema,
    UserEditSchema,
    type UserCreateValues,
    type UserEditValues,
} from '@/schemas/user';

// ✅ Server Actions
import { createUser, editUser } from '@/app/admin/users/action/user';

// ✅ NEW: 用於使 react-query 的列表快取失效
import { useQueryClient } from '@tanstack/react-query';

const LIST_PATH = '/admin/users';

// 不顯示 role/verifyNow；建立時密碼必填、編輯選填
type UserFormValues = Omit<UserEditValues, 'role' | 'verifyNow'> & {
    password?: string;
};

interface Props {
    initialData?: Partial<UserFormValues> & { id?: string };
    method?: 'POST' | 'PUT';
}

export default function UserForm({ initialData, method = 'POST' }: Props) {
    const router = useRouter();
    const { show, hide } = useLoadingStore();
    const { toast } = useToast();
    const qc = useQueryClient(); // ✅ NEW

    const [imgPreview, setImgPreview] = useState<string>(
        initialData?.image ?? ''
    );
    const [isLoading, setIsLoading] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string>();
    const [success, setSuccess] = useState<string>();

    const isEdit = method === 'PUT' || Boolean(initialData?.id);
    const headingTitle = isEdit ? '編輯使用者' : '新增使用者';
    const headingDesc = isEdit
        ? '可編輯名稱、Email、頭像；密碼留空則不變。'
        : '請填寫使用者資料。帶 * 為必填。';

    // ✅ 依模式切換 resolver
    const createResolver: Resolver<UserFormValues> = zodResolver(
        UserCreateSchema as any
    );
    const editResolver: Resolver<UserFormValues> = zodResolver(
        UserEditSchema as any
    );
    const resolver = isEdit ? editResolver : createResolver;

    const form = useForm<UserFormValues>({
        resolver,
        mode: 'onChange',
        defaultValues: {
            name: initialData?.name ?? '',
            email: initialData?.email ?? '',
            // 編輯模式 undefined；新增模式空字串由 schema 擋必填
            password: isEdit ? undefined : '',
            // 圖片用 undefined，避免被誤判必填
            image: (initialData?.image as any) ?? undefined,
        },
    });
    const { isValid, isSubmitting } = form.formState;

    // 正規化，空字串轉 undefined
    function normalize(values: UserFormValues) {
        return {
            ...values,
            name: values.name?.trim() || undefined,
            email: values.email?.trim() || undefined,
            image: values.image?.trim() || undefined,
            password: values.password ? values.password : undefined,
        };
    }

    const handleImageUpload = useCallback(
        async (file: File) => {
            setIsLoading(true);
            show();
            try {
                const res = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'content-type': file.type },
                    body: file,
                });
                if (!res.ok) throw new Error('上傳失敗');
                const { url } = await res.json();

                form.setValue('image', url, { shouldValidate: true });
                const previewUrl = URL.createObjectURL(file);
                setImgPreview(previewUrl);

                toast({
                    title: '上傳成功',
                    description: '已更新頭像預覽',
                    duration: 1500,
                });
            } catch (err: any) {
                toast({
                    variant: 'destructive',
                    title: err?.message ?? '上傳失敗',
                    duration: 1800,
                });
            } finally {
                setIsLoading(false);
                hide();
            }
        },
        [form, show, hide, toast]
    );

    const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size / 1024 / 1024 > 50) {
            toast({
                variant: 'destructive',
                title: '檔案過大',
                description: '上限 50MB，請重新選擇',
                duration: 1800,
            });
            return;
        }
        handleImageUpload(file);
    };

    const onSubmit: SubmitHandler<UserFormValues> = (values) => {
        setError(undefined);
        setSuccess(undefined);

        startTransition(async () => {
            setIsLoading(true);
            show();
            try {
                const payload = normalize(values);

                // 新增模式：必須有 email / password
                if (!isEdit) {
                    if (!payload.email) {
                        setError('請輸入 Email');
                        return;
                    }
                    if (!payload.password) {
                        setError('請輸入密碼（至少 8 碼）');
                        return;
                    }
                }

                let res: { error?: string; success?: string } | undefined;

                if (isEdit) {
                    const id = initialData?.id;
                    if (!id) {
                        setError('缺少編輯目標 ID');
                        return;
                    }
                    // 角色固定為 ADMIN（Server Action 端支援）
                    res = await editUser(id, {
                        name: payload.name,
                        email: payload.email,
                        image: payload.image,
                        password: payload.password, // undefined 則不更新
                        role: 'ADMIN' as any,
                    });
                } else {
                    // 後台新增：Server Action 可同時 revalidate（可選）
                    res = await createUser({
                        name: payload.name,
                        email: payload.email!,
                        password: payload.password!, // 已在前面手動確認
                        image: payload.image,
                        role: 'ADMIN' as any,
                    } as UserCreateValues);
                }

                if (res?.error) {
                    setError(res.error);
                } else {
                    setSuccess(
                        res?.success ?? (isEdit ? '更新成功' : '新增成功')
                    );

                    // ✅ 關鍵：失效 users 相關快取，確保列表立刻重抓
                    await Promise.all([
                        // 如果你的 useUsers 的 queryKey 是 ['users'] 或 ['users','list'] 會命中
                        qc.invalidateQueries({ queryKey: ['users'] }),
                        // 若你有 detail 快取，也一起失效（可選）
                        initialData?.id
                            ? qc.invalidateQueries({
                                  queryKey: ['users', 'detail', initialData.id],
                              })
                            : Promise.resolve(),
                    ]);

                    router.replace(LIST_PATH);
                    router.refresh(); // 讓任何 Server Component 一併更新（即使目前列表是 client 端也無妨）
                }
            } catch (err: any) {
                setError(err?.message ?? (isEdit ? '更新失敗' : '新增失敗'));
            } finally {
                setIsLoading(false);
                hide();
            }
        });
    };

    const formId = 'user-form';

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
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                {/* 名稱 */}
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>名稱（選填）</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="例：王小明"
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

                                {/* Email */}
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel
                                                className={
                                                    !isEdit
                                                        ? "after:ml-1 after:text-rose-500 after:content-['*']"
                                                        : undefined
                                                }
                                            >
                                                Email
                                                {!isEdit ? '' : '（可修改）'}
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="email"
                                                    inputMode="email"
                                                    placeholder="example@company.com"
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

                                {/* 密碼（建立必填、編輯選填） */}
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel
                                                className={
                                                    !isEdit
                                                        ? "after:ml-1 after:text-rose-500 after:content-['*']"
                                                        : undefined
                                                }
                                            >
                                                {isEdit
                                                    ? '新密碼（選填）'
                                                    : '密碼'}
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="password"
                                                    placeholder={
                                                        isEdit
                                                            ? '不更改則留空'
                                                            : '至少 8 碼'
                                                    }
                                                    disabled={
                                                        isPending ||
                                                        isLoading ||
                                                        isSubmitting
                                                    }
                                                    value={field.value ?? ''}
                                                    onChange={(e) =>
                                                        field.onChange(
                                                            e.target.value ||
                                                                undefined
                                                        )
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* 頭像上傳（選填） */}
                            <div className="space-y-2">
                                <FormField
                                    control={form.control}
                                    name="image"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>頭像（選填）</FormLabel>

                                            <label
                                                htmlFor="upload-avatar"
                                                className="group relative flex h-56 w-full cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-slate-50/60 transition hover:bg-slate-50"
                                            >
                                                <div className="absolute inset-0 z-10" />
                                                <div
                                                    className={`z-[3] flex flex-col items-center justify-center px-10 text-center ${
                                                        imgPreview
                                                            ? 'absolute inset-0 rounded-xl bg-white/80 opacity-0 backdrop-blur-sm transition group-hover:opacity-100'
                                                            : ''
                                                    }`}
                                                >
                                                    <svg
                                                        className="h-7 w-7"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path d="M4 14.9A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.24" />
                                                        <path d="M12 12v9" />
                                                        <path d="m16 16-4-4-4 4" />
                                                    </svg>
                                                    <p className="mt-2 text-sm text-slate-500">
                                                        拖曳或點擊上傳
                                                    </p>
                                                </div>

                                                {imgPreview ? (
                                                    <Image
                                                        src={imgPreview}
                                                        alt="頭像預覽"
                                                        fill
                                                        className="rounded-xl object-contain bg-white"
                                                    />
                                                ) : null}
                                            </label>

                                            <input
                                                id="upload-avatar"
                                                type="file"
                                                className="hidden"
                                                onChange={handleFileInput}
                                            />
                                            <p className="text-xs text-slate-500">
                                                支援單張圖片上傳（最大
                                                50MB）。
                                            </p>

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
                                form="user-form"
                                disabled={
                                    !isValid ||
                                    isLoading ||
                                    isPending ||
                                    isSubmitting
                                }
                            >
                                {isEdit ? '儲存變更' : '新增使用者'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </Form>
    );
}

'use client';
import React, { useState, useTransition } from 'react';
import CardWrapper from '@/components/CardWrapper';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { NewPasswordSchema } from '@/schemas';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import FormError from '@/components/auth/FormError';
import FormSuccess from '@/components/auth/FormSuccess';
import { newPassword } from '@/action/new-password';
import { useSearchParams } from 'next/navigation';

interface ResetFormProps {
    title: string;
    backButtonLable: string;
    backButtonHref: string;
    privacy?: string;
}

export default function NewPasswordForm({
    title,
    backButtonLable,
    backButtonHref,
    privacy,
}: ResetFormProps) {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [error, setError] = useState<string | undefined>('');
    const [success, setSuccess] = useState<string | undefined>('');
    const [isPending, startTransution] = useTransition();
    const form = useForm<z.infer<typeof NewPasswordSchema>>({
        resolver: zodResolver(NewPasswordSchema),
        defaultValues: {
            password: '',
        },
    });

    const onSubmit = async (values: z.infer<typeof NewPasswordSchema>) => {
        setError('');
        setSuccess('');
        startTransution(() => {
            newPassword(values, token).then((data) => {
                setError(data?.error);
                setSuccess(data?.success);
            });
        });
    };

    return (
        <CardWrapper
            title={title}
            backButtonLable={backButtonLable}
            backButtonHref={backButtonHref}
            showSocial={false}
        >
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                >
                    <div className="space-y-6">
                        <FormField
                            disabled={isPending}
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>密碼</FormLabel>
                                    <FormControl>
                                        <Input placeholder='請輸入新密碼' type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormError message={error} />
                        <FormSuccess message={success} />
                        <p className="text-xs text-neutral-500">{privacy}</p>
                        <Button
                            className="w-full bg-blue-500"
                            disabled={isPending}
                            type="submit"
                        >
                            送出
                        </Button>
                    </div>
                </form>
            </Form>
        </CardWrapper>
    );
}

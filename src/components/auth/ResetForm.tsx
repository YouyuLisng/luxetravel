'use client';
import React, { useState, useTransition } from 'react';
import CardWrapper from '@/components/CardWrapper';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ResetSchema } from '@/schemas';
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
import { reset } from '@/action/reset';
import { useRouter } from 'next/navigation';

interface ResetFormProps {
    title: string;
    backButtonLable: string;
    backButtonHref: string;
    privacy?: string;
}

export default function ResetForm({
    title,
    backButtonLable,
    backButtonHref,
    privacy,
}: ResetFormProps) {
    const router = useRouter();

    const [error, setError] = useState<string | undefined>('');
    const [success, setSuccess] = useState<string | undefined>('');
    const [isPending, startTransution] = useTransition();
    const form = useForm<z.infer<typeof ResetSchema>>({
        resolver: zodResolver(ResetSchema),
        defaultValues: {
            email: '',
        },
    });

    const onSubmit = async (values: z.infer<typeof ResetSchema>) => {
        setError('');
        setSuccess('');
        startTransution(() => {
            reset(values).then((data) => {
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
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder='請輸入Email' type="email" {...field} />
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
                            送出重設密碼信件
                        </Button>
                    </div>
                </form>
            </Form>
        </CardWrapper>
    );
}

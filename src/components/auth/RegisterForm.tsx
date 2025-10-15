'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import { register } from '@/action/register'; // ✅ 請建立此 action
import { RegisterSchema } from '@/schemas'; // ✅ 請定義註冊用 schema

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import FormError from '@/components/auth/FormError';
import FormSuccess from '@/components/auth/FormSuccess';

export function RegisterForm({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    const router = useRouter();

    const [error, setError] = useState<string | undefined>('');
    const [success, setSuccess] = useState<string | undefined>('');
    const [isPending, startTransition] = useTransition();

    const form = useForm<z.infer<typeof RegisterSchema>>({
        resolver: zodResolver(RegisterSchema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
        },
    });

    const onSubmit = (values: z.infer<typeof RegisterSchema>) => {
        setError('');
        setSuccess('');

        startTransition(() => {
            register(values).then((data) => {
                if (data?.error) {
                    setError(data.error);
                } else {
                    setSuccess(data.success);
                }
            });
        });
    };

    return (
        <div className={cn('flex flex-col gap-6', className)} {...props}>
            <Card className="overflow-hidden">
                <CardContent className="grid p-0 md:grid-cols-2">
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="p-6 md:p-8"
                        >
                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col items-center text-center">
                                    <h1 className="text-2xl font-bold">建立新帳號</h1>
                                    <p className="text-muted-foreground">
                                        請輸入資料完成註冊
                                    </p>
                                </div>
                                <FormField
                                    control={form.control}
                                    name="name"
                                    disabled={isPending}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>姓名</FormLabel>
                                            <FormControl>
                                                <Input type="text" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="email"
                                    disabled={isPending}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>電子信箱</FormLabel>
                                            <FormControl>
                                                <Input type="email" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="password"
                                    disabled={isPending}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>密碼</FormLabel>
                                            <FormControl>
                                                <Input type="password" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormError message={error} />
                                <FormSuccess message={success} />

                                <Button type="submit" className="w-full" disabled={isPending}>
                                    註冊
                                </Button>

                                <div className="text-center text-sm">
                                    已經有帳號？{' '}
                                    <Link href="/auth/login" className="underline underline-offset-4">
                                        登入
                                    </Link>
                                </div>
                            </div>
                        </form>
                    </Form>

                    <div className="relative hidden bg-muted md:block">
                        <img
                            src="/placeholder.svg"
                            alt="Register"
                            className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="text-center text-xs text-muted-foreground [&_a]:underline hover:[&_a]:text-primary">
                註冊即表示您同意我們的 <a href="#">服務條款</a> 與 <a href="#">隱私政策</a>。
            </div>
        </div>
    );
}

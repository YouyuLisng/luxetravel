import React from 'react';
import { cn } from '@/lib/utils';
import { Poppins } from 'next/font/google';

const font = Poppins({
    subsets: ['latin'],
    weight: ['600'],
});

interface HeaderProps {
    title: string;
    backButtonLable: string;
    backButtonHref: string;
}

export default function header({
    title,
}: HeaderProps) {
    return (
        <div className="w-full flex flex-col gap-y-4 items-center justify-center">
            <h1 className={cn('text-3xl font-semibold', font.className)}>
                {title}
            </h1>
        </div>
    );
}

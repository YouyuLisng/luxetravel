
import React from 'react';
import Image from 'next/image';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from '@/components/ui/card';
import Header from '@/components/Header';
import Social from '@/components/Social';
import BackButton from '@/components/BackButton';

interface CardWrapperProps {
    title: string;
    children: React.ReactNode;
    backButtonLable: string;
    backButtonHref: string;
    showImage?: boolean;
    showSocial?: boolean;
}

export default function CardWrapper({
    title,
    children,
    backButtonLable,
    backButtonHref,
    showImage,
    showSocial,
}: CardWrapperProps) {
    return (
        <Card className="w-full md:shadow flex flex-col shadow-none">
            <CardHeader>
                <Header
                    title={title}
                    backButtonLable={backButtonLable}
                    backButtonHref={backButtonHref}
                />
            </CardHeader>
            <CardContent className="flex-1">{children}</CardContent>
            {showSocial && (
                <CardFooter>
                    <Social />
                </CardFooter>
            )}
            {backButtonLable !== "" && (
                <CardFooter>
                    <BackButton label={backButtonLable} href={backButtonHref} />
                </CardFooter>
            )}
        </Card>
    );
}

"use client"
import React, { use, useCallback, useEffect, useState } from 'react'
import CardWrapper from '@/components/CardWrapper'
import { BeatLoader } from "react-spinners"
import FormError from '@/components/auth/FormError';
import FormSuccess from '@/components/auth/FormSuccess';
import { useSearchParams } from 'next/navigation';
import { newVerification } from '@/action/new-verification';

interface NewVerificationFormProps {
    successMessage?: string;
    errorMessage?: string;
}

export default function NewVerificationForm({
    successMessage,
    errorMessage
}:NewVerificationFormProps) {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [error, setError] = useState<string | undefined>(errorMessage);
    const [success, setSuccess] = useState<string | undefined>(successMessage);

    const onSubmit = useCallback (() => {
        if (success || error) return;

        if (!token) {
            setError("Missing verification token");
            return;
        }

        newVerification(token)
        .then((data) => {
            setSuccess(data.success);
            setError(data.error);
        })
    }, [token, success, error]);

    useEffect(() => {
        onSubmit();
    }, [onSubmit]);
    
    return (
        <CardWrapper
            title='驗證信件'
            backButtonLable='回到登入頁面'
            backButtonHref='/auth/login'
        >
            <div className='w-[400px] flex items-center justify-center'>
                {!success && !error && (
                    <BeatLoader />
                )}
                <FormSuccess message={success} />
                {!success && (
                    <FormError message={error} />
                )}
            </div>
        </CardWrapper>
    );
}

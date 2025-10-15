import ResetForm from '@/components/auth/ResetForm';
import React from 'react';

export default function page() {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
            <div className="w-full max-w-sm md:max-w-md">
                <ResetForm
                    title="忘記密碼?"
                    backButtonLable="回到登入頁面"
                    backButtonHref="/auth/login"
                />
            </div>
        </div>
    );
}

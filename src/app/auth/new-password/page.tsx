import NewPasswordForm from '@/components/auth/NewPasswordForm';
import React, { Suspense } from 'react';

export default function page() {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
            <div className="w-full max-w-sm md:max-w-md">
                <Suspense fallback={<div>載入中...</div>}>
                    <NewPasswordForm
                        title="重新設定新密碼"
                        backButtonLable="回到登入頁"
                        backButtonHref="/auth/login"
                    />
                </Suspense>
            </div>
        </div>
    );
}

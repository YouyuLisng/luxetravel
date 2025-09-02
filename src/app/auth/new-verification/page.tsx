import NewVerificationForm from '@/components/auth/NewVerificationForm';
import { Suspense } from 'react';

export default function VerificationPage() {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
            <div className="w-full max-w-sm md:max-w-md">
                <Suspense fallback={<div>載入中...</div>}>
                    <NewVerificationForm />
                </Suspense>
            </div>
        </div>
    );
}

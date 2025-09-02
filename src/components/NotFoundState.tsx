'use client';

import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import Button from '@/components/Button';
import { IoIosWarning } from 'react-icons/io';

interface NotFoundStateProps {
    title?: string;
    showReaet?: boolean;
}

const NotFoundState: React.FC<NotFoundStateProps> = ({
    title,
    showReaet,
}) => {
    const router = useRouter();
    const { resolvedTheme } = useTheme();

    const isDark = resolvedTheme === 'dark';

    return (
        <div className="h-[60vh] flex flex-col gap-2 justify-center items-center">
            <IoIosWarning className="text-yellow-500" size={60} />
            <p className={`text-2xl ${isDark ? 'text-white' : 'text-black'}`}>
                {title}
            </p>
            <div className="w-48 mt-4">
                {showReaet && (
                    <Button
                        outline
                        label="返回"
                        onClick={() => router.push('/')}
                    />
                )}
            </div>
        </div>
    );
};

export default NotFoundState;

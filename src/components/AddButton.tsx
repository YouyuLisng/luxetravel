'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface AddButtonProps {
    url: string;
    label?: string;
}

export default function AddButton({ url, label = '新增' }: AddButtonProps) {
    const router = useRouter();

    return (
        <Button onClick={() => router.push(url)}>
            <Plus className="mr-0.5 h-4 w-4" />
            {label}
        </Button>
    );
}

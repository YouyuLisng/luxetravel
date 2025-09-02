// app/(admin)/admin/user/[id]/page.tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import UserForm from '@/app/admin/users/components/UserForm';

interface Props {
    params: Promise<{ id: string }>;
}


export async function generateMetadata({
    params,
}: Props): Promise<Metadata> {
    const { id } = await params;

    const user = await db.user.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            emailVerified: true,
            role: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!user) {
        notFound();
    }
    return { title: `User - ${user.name}` };
}

export default async function Page({ params }: Props) {
    const { id } = await params;

    const user = await db.user.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            emailVerified: true,
            role: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!user) {
        notFound();
    }

    return (
        <UserForm
            method="PUT"
            initialData={{
                id: user.id,
                name: user.name ?? '',
                email: user.email ?? '',
                image: user.image ?? undefined,
            }}
        />
    );
}

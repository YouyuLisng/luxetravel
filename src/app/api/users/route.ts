// app/api/users/route.ts
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export async function GET() {
    const session = await auth();
    // if (!session || session.user.role !== 'ADMIN') {
    //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const users = await db.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            emailVerified: true,
            createdAt: true,
        },
    });

    return NextResponse.json({ users });
}

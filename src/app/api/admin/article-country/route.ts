import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
// import getCurrentUser from '@/action/getCurrentUser';

export async function POST(request: Request) {
    // const currentUser = await getCurrentUser();
    // if (!currentUser) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    try {
        const body = await request.json();
        const { name, nameZh, code } = body;

        if (!name) {
            return NextResponse.json(
                { error: 'Missing name' },
                { status: 400 }
            );
        }
        if (!nameZh) {
            return NextResponse.json(
                { error: 'Missing nameZh' },
                { status: 400 }
            );
        }
        if (!code) {
            return NextResponse.json(
                { error: 'Missing code' },
                { status: 400 }
            );
        }
        const country = await db.articleCountry.create({
            data: { name, nameZh, code },
        });
        console.log(country)
        return NextResponse.json(
            {
                status: true,
                message: `Country「${country.name} / ${country.nameZh}」建立成功`,
                data: country,
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Error creating country:', error);
        if (error?.code === 'P2002') {
            // name 欄位 unique
            return NextResponse.json(
                { error: 'Country 已存在（name 重複）' },
                { status: 409 }
            );
        }
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const rows = await db.articleCountry.findMany({
            orderBy: { name: 'asc' },
            include: {
                articles: { include: { article: true } },
            },
        });

        const countries = rows.map((row) => ({
            id: row.id,
            name: row.name,
            nameZh: row.nameZh,
            code: row.code,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            articles: row.articles.map((ac) => ({
                id: ac.article.id,
                title: ac.article.title,
                subtitle: ac.article.subtitle,
                linkUrl: ac.article.linkUrl,
                imageUrl: ac.article.imageUrl,
                createdAt: ac.article.createdAt,
                updatedAt: ac.article.updatedAt,
            })),
        }));

        return NextResponse.json(
            {
                status: true,
                message: '成功取得 Countries',
                data: countries,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error fetching countries:', error);
        return NextResponse.json(
            { error: 'Failed to fetch countries' },
            { status: 500 }
        );
    }
}

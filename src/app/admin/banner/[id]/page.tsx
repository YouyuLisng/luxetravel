// app/(admin)/admin/banner/[id]/page.tsx
import type { Metadata } from 'next';
import ClientBannerPage from '../components/ClientBannerPage';

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    return { title: `Banner - ${id}` };
}

export default async function Page({ params }: Props) {
    const { id } = await params;

    return <ClientBannerPage id={id} />;
}

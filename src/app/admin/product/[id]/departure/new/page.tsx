import { db } from '@/lib/db';
import TourForm from '../components/TourForm';

interface Props {
    params: Promise<{ id: string }>;
}

export default async function Page({ params }: Props) {
    const { id } = await params;
    const product = await db.tourProduct.findUnique({
        where: { id },
        include: {
            flights: true,
            itineraries: true,
            highlights: true,
            maps: true,
        },
    });

    if (!product) return <div>找不到產品</div>;

    return (
        <div>
            <TourForm id={id} method='POST' />
        </div>
    );
}

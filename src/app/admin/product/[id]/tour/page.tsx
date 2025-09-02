import { db } from '@/lib/db';
import TourCalendar from './components/TourCalendar';

interface Props {
    params: Promise<{ id: string }>;
}

export default async function Page({ params }: Props) {
    const { id } = await params;

    const product = await db.tourProduct.findUnique({
        where: { id },
        select: { id: true, name: true },
    });
    if (!product) return <div>找不到產品</div>;

    const departures = await db.tours.findMany({
        where: { productId: id },
        orderBy: { departDate: 'asc' },
        select: {
            id: true,
            code: true,
            departDate: true,
            adult: true,
        },
    });

    const events = departures.map((dep) => ({
        id: dep.id,
        title: `${dep.code}`,
        start: dep.departDate,
        price: dep.adult ?? null,
    }));

    return (
        <TourCalendar
            productId={product.id}
            productName={product.name}
            initialEvents={events}
        />
    );
}

'use server';

import { db } from '@/lib/db';

export async function createFullProduct(data: {
    tour: any;
    flights: any[];
    map: any;
    highlights: any[];
    itineraries: any[];
}) {
    try {
        const result = await db.$transaction(async (tx) => {
            const product = await tx.tourProduct.create({ data: data.tour });

            if (data.flights?.length) {
                await tx.flight.createMany({
                    data: data.flights.map((f) => ({
                        ...f,
                        productId: product.id,
                    })),
                });
            }

            if (data.map) {
                await tx.tourMap.create({
                    data: { ...data.map, productId: product.id },
                });
            }

            if (data.highlights?.length) {
                await tx.tourHighlight.createMany({
                    data: data.highlights.map((h) => ({
                        ...h,
                        productId: product.id,
                    })),
                });
            }

            if (data.itineraries?.length) {
                await tx.itinerary.createMany({
                    data: data.itineraries.map((i) => ({
                        ...i,
                        productId: product.id,
                    })),
                });
            }

            return product;
        });

        return { success: '建立成功', data: result };
    } catch (err) {
        console.error('createFullProduct error:', err);
        return { error: '建立失敗' };
    }
}

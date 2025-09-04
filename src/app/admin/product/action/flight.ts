'use server';

import { db } from '@/lib/db';
import { FlightCreateSchema, type FlightCreateValues } from '@/schemas/flight';

/** 儲存某產品的 Flights（全刪再寫） */
export async function saveFlights(
  productId: string,
  flights: FlightCreateValues[]
) {
  if (!productId) return { error: '缺少 productId' };

  // 驗證格式
  const parsed = flights.map((v) => FlightCreateSchema.safeParse(v));
  if (parsed.some((p) => !p.success)) {
    return { error: '欄位格式錯誤' };
  }

  try {
    await db.flight.deleteMany({ where: { productId } });

    if (flights.length > 0) {
      await db.flight.createMany({
        data: flights.map((f) => ({ ...f, productId })),
      });
    }

    return { success: `航班已更新，共 ${flights.length} 筆` };
  } catch (err) {
    console.error('saveFlights error:', err);
    return { error: '航班儲存失敗' };
  }
}

/** 查詢某產品下的 Flights */
export async function getFlightsByProductId(
  productId: string
): Promise<{ data: FlightCreateValues[] } | { error: string }> {
  if (!productId) return { error: '缺少 productId' };

  try {
    const flights = await db.flight.findMany({
      where: { productId },
      orderBy: { createdAt: 'asc' },
    });
    return { data: flights };
  } catch (err) {
    console.error('getFlightsByProductId error:', err);
    return { error: '查詢失敗' };
  }
}

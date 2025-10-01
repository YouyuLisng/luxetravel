import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

/** 國家代碼 → 地區對照表 */
const EUROPE_REGIONS: Record<string, string> = {
    // 西歐 Western Europe
    BE: '西歐',
    FR: '西歐',
    IE: '西歐',
    LU: '西歐',
    MC: '西歐',
    GB: '西歐',
    NL: '西歐',

    // 北歐 Northern Europe
    DK: '北歐',
    EE: '北歐',
    FI: '北歐',
    IS: '北歐',
    LV: '北歐',
    LT: '北歐',
    NO: '北歐',
    SE: '北歐',
    AX: '北歐',
    FO: '北歐',

    // 南歐 Southern Europe
    AD: '南歐',
    AL: '南歐',
    BA: '南歐',
    HR: '南歐',
    GR: '南歐',
    IT: '南歐',
    MT: '南歐',
    ME: '南歐',
    MK: '南歐',
    PT: '南歐',
    SM: '南歐',
    RS: '南歐',
    SI: '南歐',
    ES: '南歐',
    VA: '南歐',
    XK: '南歐',
    CY: '南歐',

    // 東歐 Eastern Europe
    BY: '東歐',
    BG: '東歐',
    MD: '東歐',
    RO: '東歐',
    RU: '東歐',
    UA: '東歐',

    // 中歐 Central Europe
    AT: '中歐',
    CZ: '中歐',
    DE: '中歐',
    HU: '中歐',
    LI: '中歐',
    PL: '中歐',
    SK: '中歐',
    CH: '中歐',
};

export async function GET() {
    try {
        // 1. 找出所有上架產品的國家
        const products = await db.tourProduct.findMany({
            where: { status: 1 },
            select: { countries: true },
        });

        const allCodes = new Set<string>();
        products.forEach((p) => {
            p.countries?.forEach((c) => {
                if (c) allCodes.add(c);
            });
        });

        const codes = Array.from(allCodes);
        if (codes.length === 0) {
            return NextResponse.json({ status: 200, total: 0, data: [] });
        }

        // 2. 查詢有上架的國家資料
        const countries = await db.country.findMany({
            where: { code: { in: codes }, enabled: true },
            select: {
                code: true,
                nameZh: true,
                nameEn: true,
            },
        });

        // 3. 按地區分組
        const grouped: Record<string, any[]> = {};
        countries.forEach((c) => {
            const region = EUROPE_REGIONS[c.code] ?? '其他';
            if (!grouped[region]) grouped[region] = [];
            grouped[region].push(c); // ✅ 只保留 code, nameZh, nameEn
        });

        return NextResponse.json({
            status: 200,
            total: countries.length,
            data: Object.entries(grouped).map(([region, countries]) => ({
                region,
                countries,
            })),
        });
    } catch (err: any) {
        console.error('GET /api/product/countries error:', err);
        return NextResponse.json({
            status: 500,
            message: err?.message ?? '伺服器錯誤',
        });
    }
}

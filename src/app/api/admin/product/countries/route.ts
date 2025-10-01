import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

/** 國家代碼 → 地區對照表 */
// utils/regionMap.ts
export const EUROPE_REGIONS: Record<string, string> = {
  // 西歐 Western Europe
  BE: '西歐', // 比利時
  FR: '西歐', // 法國
  IE: '西歐', // 愛爾蘭
  LU: '西歐', // 盧森堡
  MC: '西歐', // 摩納哥
  GB: '西歐', // 英國

  // 北歐 Northern Europe
  DK: '北歐', // 丹麥
  EE: '北歐', // 愛沙尼亞
  FI: '北歐', // 芬蘭
  IS: '北歐', // 冰島
  LV: '北歐', // 拉脫維亞
  LT: '北歐', // 立陶宛
  NO: '北歐', // 挪威
  SE: '北歐', // 瑞典
  AX: '北歐', // 奧蘭群島（芬蘭自治）
  FO: '北歐', // 法羅群島（丹麥自治）

  // 南歐 Southern Europe
  AD: '南歐', // 安道爾
  AL: '南歐', // 阿爾巴尼亞
  BA: '南歐', // 波士尼亞與赫塞哥維納
  HR: '南歐', // 克羅埃西亞
  GR: '南歐', // 希臘
  IT: '南歐', // 義大利
  MT: '南歐', // 馬爾他
  ME: '南歐', // 蒙特內哥羅
  MK: '南歐', // 北馬其頓
  PT: '南歐', // 葡萄牙
  SM: '南歐', // 聖馬利諾
  RS: '南歐', // 塞爾維亞
  SI: '南歐', // 斯洛維尼亞
  ES: '南歐', // 西班牙
  VA: '南歐', // 梵蒂岡
  XK: '南歐', // 科索沃（部分承認）
  CY: '南歐', // 賽普勒斯

  // 東歐 Eastern Europe
  BY: '東歐', // 白俄羅斯
  BG: '東歐', // 保加利亞
  MD: '東歐', // 摩爾多瓦
  RO: '東歐', // 羅馬尼亞
  RU: '東歐', // 俄羅斯
  UA: '東歐', // 烏克蘭

  // 中歐 Central Europe
  AT: '中歐', // 奧地利
  CZ: '中歐', // 捷克
  DE: '中歐', // 德國
  HU: '中歐', // 匈牙利
  LI: '中歐', // 列支敦士登
  PL: '中歐', // 波蘭
  SK: '中歐', // 斯洛伐克
  CH: '中歐', // 瑞士
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
                imageUrl: true,
            },
        });

        // 3. 按地區分組
        const grouped: Record<string, any[]> = {};
        countries.forEach((c) => {
            const region = EUROPE_REGIONS[c.code] ?? '其他';
            if (!grouped[region]) grouped[region] = [];
            grouped[region].push({
                ...c,
                checked: true, // 有上架的才會回傳，全部都是 true
            });
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

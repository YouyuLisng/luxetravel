'use server';

import { db } from '@/lib/db';
import {
    AirportCreateSchema,
    AirportEditSchema,
    type AirportCreateValues,
    type AirportEditValues,
} from '@/schemas/airport';

/** 新增 Airport（檢查唯一碼與外鍵存在） */
export async function createAirport(values: AirportCreateValues) {
    const parsed = AirportCreateSchema.safeParse(values);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const { code, nameZh, nameEn, imageUrl, enabled, regionId, countryId } =
        parsed.data;
    const upper = code.toUpperCase();

    // 機場代碼唯一
    const dup = await db.airport.findUnique({ where: { code: upper } });
    if (dup) return { error: `代碼已存在：${upper}` };

    // 外鍵存在性檢查
    const [region, country] = await Promise.all([
        db.region.findUnique({ where: { id: regionId } }),
        db.country.findUnique({ where: { id: countryId } }),
    ]);
    if (!region) return { error: '找不到地區' };
    if (!country) return { error: '找不到國家' };

    const data = await db.airport.create({
        data: {
            code: upper,
            nameZh: nameZh.trim(),
            nameEn: nameEn.trim(),
            imageUrl: imageUrl === null ? null : imageUrl?.trim(),
            enabled: enabled ?? true,
            regionId,
            countryId,
        },
    });

    return { success: '新增成功', data };
}

/** 編輯 Airport（依 id） */
export async function editAirport(id: string, values: AirportEditValues) {
    if (!id) return { error: '無效的 ID' };

    const parsed = AirportEditSchema.safeParse(values);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const exists = await db.airport.findUnique({ where: { id } });
    if (!exists) return { error: '找不到 Airport' };

    const { code, nameZh, nameEn, imageUrl, enabled, regionId, countryId } =
        parsed.data;

    // 若更新代碼，先做唯一檢查
    if (code !== undefined) {
        const up = code.toUpperCase();
        if (up !== exists.code) {
            const dup = await db.airport.findUnique({ where: { code: up } });
            if (dup) return { error: `代碼已存在：${up}` };
        }
    }

    // 若更新外鍵，檢查是否存在
    if (regionId !== undefined) {
        const region = await db.region.findUnique({ where: { id: regionId } });
        if (!region) return { error: '找不到地區' };
    }
    if (countryId !== undefined) {
        const country = await db.country.findUnique({
            where: { id: countryId },
        });
        if (!country) return { error: '找不到國家' };
    }

    const patch: {
        code?: string;
        nameZh?: string;
        nameEn?: string;
        imageUrl?: string | null;
        enabled?: boolean;
        regionId?: string;
        countryId?: string;
    } = {};

    if (code !== undefined) patch.code = code.toUpperCase();
    if (nameZh !== undefined) patch.nameZh = nameZh.trim();
    if (nameEn !== undefined) patch.nameEn = nameEn.trim();
    if (imageUrl !== undefined)
        patch.imageUrl = imageUrl === null ? null : imageUrl.trim();
    if (enabled !== undefined) patch.enabled = enabled;
    if (regionId !== undefined) patch.regionId = regionId;
    if (countryId !== undefined) patch.countryId = countryId;

    const data = await db.airport.update({ where: { id }, data: patch });
    return { success: '更新成功', data };
}

/** 刪除 Airport（依 id） */
export async function deleteAirport(id: string) {
    if (!id) return { error: '無效的 ID' };

    const exists = await db.airport.findUnique({ where: { id } });
    if (!exists) return { error: '找不到 Airport' };

    const data = await db.airport.delete({ where: { id } });
    return { success: '刪除成功', data };
}

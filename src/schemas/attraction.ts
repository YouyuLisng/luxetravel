import { z } from 'zod';

/** Create：依 Prisma，只有 code/city/imageUrl 可不填；tags 預設 [] */
export const AttractionCreateSchema = z.object({
    code: z.string().optional().nullable(),
    nameZh: z.string().min(1),
    nameEn: z.string().min(1),
    content: z.string().min(1),
    region: z.string().min(1),
    country: z.string().min(1),
    city: z.string().optional().nullable(),
    tags: z.array(z.string()).optional().default([]),
    imageUrl: z.string().url().optional().nullable(),
    enabled: z.boolean().optional(),
});

export type AttractionCreateValues = z.infer<typeof AttractionCreateSchema>;

/** Edit：全部欄位皆可選；允許以 null 清空 code/city/imageUrl */
export const AttractionEditSchema = z.object({
    code: z.string().optional().nullable(),
    nameZh: z.string().min(1).optional(),
    nameEn: z.string().min(1).optional(),
    content: z.string().min(1).optional(),
    region: z.string().min(1).optional(),
    country: z.string().min(1).optional(),
    city: z.string().optional().nullable(),
    tags: z.array(z.string()).optional(),
    imageUrl: z.string().url().optional().nullable(),
    enabled: z.boolean().optional(),
});

export type AttractionEditValues = z.infer<typeof AttractionEditSchema>;

import { z } from 'zod'

/** 共用：可為空字串時轉為 undefined（前端空值不擋） */
const emptyToUndefined = z
  .string()
  .transform((v) => (v?.trim() === '' ? undefined : v?.trim()))

/** 影像網址：可省略或清空（nullable 代表可傳 null 來清空） */
const imageUrlSchema = z
  .string()
  .url('圖片網址格式不正確')
  .or(z.literal(''))
  .optional()
  .nullable()

/** Slug：用於前台 URL，例如 /pages/japan-ski */
const slugSchema = z
  .string({ required_error: '請輸入 slug' })
  .min(1, 'Slug 不可為空')
  .regex(/^[a-z0-9-]+$/, 'Slug 僅能包含小寫英文、數字與 -')

/** 建立 Page：必填 title / slug，其餘可選 */
export const PageCreateSchema = z.object({
  title: z
    .string({ required_error: '請輸入標題' })
    .min(1, '標題不可為空')
    .transform((v) => v.trim()),
  slug: slugSchema,
  content: emptyToUndefined.optional(),
  seoTitle: emptyToUndefined.optional(),
  seoDesc: emptyToUndefined.optional(),
  seoImage: imageUrlSchema,
  keywords: z.array(z.string().trim()).default([]), // ✅ 一律回傳 string[]

  // 🔥 新增欄位
  icon: imageUrlSchema,              // 小 icon（可空或 null）
  activityTextEn: emptyToUndefined.optional(), // 活動文字英文
})

export type PageCreateValues = z.infer<typeof PageCreateSchema>

/** 編輯 Page：所有欄位皆可選 */
export const PageEditSchema = z.object({
  title: emptyToUndefined.optional(),
  slug: slugSchema.optional(),
  content: emptyToUndefined.optional(),
  seoTitle: emptyToUndefined.optional(),
  seoDesc: emptyToUndefined.optional(),
  seoImage: imageUrlSchema,
  keywords: z.array(z.string().trim()).optional().default([]),

  // 🔥 新增欄位
  icon: imageUrlSchema,
  activityTextEn: emptyToUndefined.optional(),
})

export type PageEditValues = z.infer<typeof PageEditSchema>

import { z } from "zod";

export const TourHighlightSchema = z.object({
  productId: z.string().min(1, "缺少產品 ID"),
  imageUrls: z
    .array(z.string().optional().nullable()),
  layout: z.number().int().min(1, "版型必填"),
  title: z.string().min(1, "標題必填"),
  subtitle: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  order: z.number().int().min(0, "排序必須 >= 0"),
});

/** 最外層表單用的 schema */
export const TourHighlightFormSchema = z.object({
  highlights: TourHighlightSchema.array().min(1, "至少要有一筆亮點"),
});

export type TourHighlightValues = z.infer<typeof TourHighlightSchema>;
export type TourHighlightFormValues = z.infer<typeof TourHighlightFormSchema>;

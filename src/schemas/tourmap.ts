import { z } from "zod";

export const TourMapSchema = z.object({
  productId: z.string().min(1, "缺少產品 ID"),
  imageUrl: z.string().url("地圖圖片必須是合法網址"),
  content: z.string().optional().nullable(),
});

export type TourMapValues = z.infer<typeof TourMapSchema>;

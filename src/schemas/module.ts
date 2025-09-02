import { z } from 'zod';

/** 新增用 */
export const ModuleCreateSchema = z.object({
  key: z
    .string()
    .min(1, 'Key 必填')
    .regex(/^[a-z0-9_]+$/, '只允許小寫英文、數字與底線'),
  title: z.string().min(1, '標題必填'),
  subtitle: z.string().nullable().optional(),
  type: z.enum(['ADVANTAGE', 'CONCERN'], { required_error: '請選擇類型' }),
});
export type ModuleCreateValues = z.infer<typeof ModuleCreateSchema>;

/** 編輯用（只允許改 title / subtitle） */
export const ModuleEditSchema = z.object({
  title: z.string().min(1, '標題必填'),
  subtitle: z.string().nullable().optional(),
});
export type ModuleEditValues = z.infer<typeof ModuleEditSchema>;

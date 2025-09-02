'use client';

import { useSubCategories, useSubCategory } from '../queries/subCategoryQueries';

/** Hook: 包裝 SubCategory 列表 */
export function useSubCategoriesQuery(categoryId?: string) {
  return useSubCategories(categoryId);
}

/** Hook: 包裝單一 SubCategory */
export function useSubCategoryQuery(id: string, enabled = true) {
  return useSubCategory(id);
}

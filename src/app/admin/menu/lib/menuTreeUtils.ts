import { TreeItems } from 'dnd-kit-sortable-tree';

// ✅ API 回傳資料型別（含 title + linkUrl + 巢狀 children）
export type ApiMenuItem = {
    id: string;
    title: string;
    linkUrl?: string;
    children?: ApiMenuItem[];
};

// ✅ 前端 Tree 所使用的欄位型別
// ✅ menuTreeUtils.ts (或 shared types)
export type MinimalTreeItemData = {
  value: string;
  linkUrl?: string;
  icon?: string;
  isActive?: boolean;
};


// ✅ 將 API menu 結構轉成 dnd-kit TreeItems 格式
export function transformToTreeItems(
    data: ApiMenuItem[]
): TreeItems<MinimalTreeItemData> {
    return data.map((item) => ({
        id: item.id,
        value: item.title,
        linkUrl: item.linkUrl, // 🔥 確保 linkUrl 帶入
        children: item.children ? transformToTreeItems(item.children) : [],
    }));
}

// ✅ 將巢狀 Tree 壓平為陣列，用於 reorder API 傳送 {id, order, parentId}
export function flattenTree(
    items: TreeItems<MinimalTreeItemData>,
    parentId: string | null = null
): { id: string | number; order: number; parentId: string | null }[] {
    return items.flatMap((item, index) => [
        {
            id: item.id,
            order: index,
            parentId: parentId,
        },
        ...(item.children
            ? flattenTree(item.children, item.id.toString())
            : []),
    ]);
}

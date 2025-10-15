import { TreeItems } from 'dnd-kit-sortable-tree';

export type ApiMenuItem = {
    id: string;
    title: string;
    linkUrl?: string;
    children?: ApiMenuItem[];
};

export type MinimalTreeItemData = {
    value: string;
    linkUrl?: string;
    icon?: string;
    isActive?: boolean;
};

export function transformToTreeItems(
    data: ApiMenuItem[]
): TreeItems<MinimalTreeItemData> {
    return data.map((item) => ({
        id: item.id,
        value: item.title,
        linkUrl: item.linkUrl,
        children: item.children ? transformToTreeItems(item.children) : [],
    }));
}

export function flattenTree(
    items: TreeItems<MinimalTreeItemData>,
    parentId: string | null = null
): { id: string | number; order: number; parentId: string | null }[] {
    return items.flatMap((item, index) => [
        { id: item.id, order: index, parentId },
        ...(item.children ? flattenTree(item.children, String(item.id)) : []),
    ]);
}

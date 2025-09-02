'use client';

import React, { useMemo, useState } from 'react';
import {
    SimpleTreeItemWrapper,
    TreeItemComponentProps,
} from 'dnd-kit-sortable-tree';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

type MinimalTreeItemData = {
    value: string;
    linkUrl?: string;
};

const MenuTreeItem = React.forwardRef<
    HTMLDivElement,
    TreeItemComponentProps<MinimalTreeItemData>
>((props, ref) => {
    const { item } = props;
    const id = useMemo(() => String(item.id), [item.id]);
    const { toast } = useToast();

    // 編輯用表單狀態
    const [editOpen, setEditOpen] = useState(false);
    const [title, setTitle] = useState(item.value ?? '');
    const [linkUrl, setLinkUrl] = useState(item.linkUrl ?? '');
    const [saving, setSaving] = useState(false);

    // 刪除 Dialog 狀態
    const [delOpen, setDelOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // 編輯儲存：PUT /api/admin/menu/:id
    const handleSave = async () => {
        try {
            setSaving(true);
            const res = await fetch(`/api/admin/menu/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, linkUrl: linkUrl || null }),
            });
            if (!res.ok) {
                const t = await res.text();
                throw new Error(`HTTP ${res.status} ${t}`);
            }

            toast({
                variant: 'success',
                title: '更新成功',
                duration: 1500,
            });

            window.dispatchEvent(new CustomEvent('menu:changed'));
            setEditOpen(false);
        } catch (err: any) {
            console.error('更新失敗：', err);
            toast({
                variant: 'destructive',
                title: '操作失敗',
                description: err?.message || '更新失敗，請稍後再試',
                duration: 1500,
            });
        } finally {
            setSaving(false);
        }
    };

    // 刪除：DELETE /api/admin/menu/:id
    const handleDelete = async () => {
        try {
            setDeleting(true);
            const res = await fetch(`/api/admin/menu/${id}`, {
                method: 'DELETE',
            });
            if (!res.ok) {
                const t = await res.text();
                throw new Error(`HTTP ${res.status} ${t}`);
            }

            toast({
                variant: 'success',
                title: '操作完成',
                description: (
                    <pre>
                        <code>
                            {JSON.stringify({ id, action: 'deleted' }, null, 2)}
                        </code>
                    </pre>
                ),
                duration: 1500,
            });

            window.dispatchEvent(new CustomEvent('menu:changed'));
            setDelOpen(false);
        } catch (err: any) {
            console.error('刪除失敗：', err);
            toast({
                variant: 'destructive',
                title: '操作失敗',
                description: err?.message || '刪除失敗，請稍後再試',
                duration: 1500,
            });
        } finally {
            setDeleting(false);
        }
    };

    return (
        <SimpleTreeItemWrapper {...props} ref={ref}>
            <div className="p-2 cursor-pointer flex justify-between items-center w-full">
                <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                        {item.value}
                    </div>
                    {item.linkUrl && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            {item.linkUrl}
                        </div>
                    )}
                </div>

                <div className="flex gap-2">
                    {/* 編輯 Dialog */}
                    <Dialog open={editOpen} onOpenChange={setEditOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600">
                                編輯
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>編輯選單</DialogTitle>
                                <DialogDescription>
                                    修改選單資訊，完成後請儲存變更。
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4">
                                <div className="grid gap-3">
                                    <Label
                                        htmlFor={`title-${id}`}
                                        className="text-gray-700 dark:text-gray-300"
                                    >
                                        標題
                                    </Label>
                                    <Input
                                        id={`title-${id}`}
                                        value={title}
                                        onChange={(e) =>
                                            setTitle(e.target.value)
                                        }
                                    />
                                </div>
                                <div className="grid gap-3">
                                    <Label
                                        htmlFor={`linkUrl-${id}`}
                                        className="text-gray-700 dark:text-gray-300"
                                    >
                                        連結網址
                                    </Label>
                                    <Input
                                        id={`linkUrl-${id}`}
                                        value={linkUrl}
                                        onChange={(e) =>
                                            setLinkUrl(e.target.value)
                                        }
                                        placeholder="例如 /about 或 https://example.com"
                                    />
                                </div>
                            </div>

                            <DialogFooter>
                                <DialogClose asChild disabled={saving}>
                                    <Button variant="outline">取消</Button>
                                </DialogClose>
                                <Button
                                    onClick={handleSave}
                                    disabled={saving || !title}
                                >
                                    {saving ? '儲存中…' : '儲存變更'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* 刪除 Dialog */}
                    <Dialog open={delOpen} onOpenChange={setDelOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" variant="destructive" className="dark:bg-red-600 dark:hover:bg-red-700">
                                刪除
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>確認刪除</DialogTitle>
                                <DialogDescription>
                                    此操作無法復原，確定要刪除此選單項目嗎？
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <DialogClose asChild disabled={deleting}>
                                    <Button variant="outline">取消</Button>
                                </DialogClose>
                                <Button
                                    variant="destructive"
                                    onClick={handleDelete}
                                    disabled={deleting}
                                >
                                    {deleting ? '刪除中…' : '刪除'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </SimpleTreeItemWrapper>
    );
});

MenuTreeItem.displayName = 'MenuTreeItem';
export default MenuTreeItem;

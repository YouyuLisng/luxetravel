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
    parentId?: string | null;
};

const MenuTreeItem = React.forwardRef<
    HTMLDivElement,
    TreeItemComponentProps<MinimalTreeItemData>
>((props, ref) => {
    const { item } = props;
    const id = useMemo(() => String(item.id), [item.id]);
    const { toast } = useToast();

    const [editOpen, setEditOpen] = useState(false);
    const [title, setTitle] = useState(item.value ?? '');
    const [linkUrl, setLinkUrl] = useState(item.linkUrl ?? '');
    const [saving, setSaving] = useState(false);
    const [delOpen, setDelOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // ✅ 編輯儲存，帶上最新 parentId
    const handleSave = async () => {
        try {
            setSaving(true);
            const currentParentId = item.parentId ?? null;

            const res = await fetch(`/api/admin/menu/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    linkUrl: linkUrl || null,
                    parentId: currentParentId,
                }),
            });

            const payload = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(payload?.message || `HTTP ${res.status}`);

            item.value = title;
            item.linkUrl = linkUrl;
            item.parentId = currentParentId;

            toast({
                variant: 'success',
                title: '更新成功',
                duration: 1200,
            });
            setEditOpen(false);
        } catch (err: any) {
            console.error('❌ 更新失敗:', err);
            toast({
                variant: 'destructive',
                title: '更新失敗',
                description: err?.message,
                duration: 1500,
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            setDeleting(true);
            const res = await fetch(`/api/admin/menu/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            toast({
                variant: 'success',
                title: '已刪除',
                duration: 1200,
            });

            window.dispatchEvent(new CustomEvent('menu:changed'));
            setDelOpen(false);
        } catch (err: any) {
            console.error('刪除失敗:', err);
            toast({
                variant: 'destructive',
                title: '刪除失敗',
                description: err?.message,
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
                    <div className="font-medium">{item.value}</div>
                    {item.linkUrl && (
                        <div className="text-xs text-gray-500">{item.linkUrl}</div>
                    )}
                </div>
                <div className="flex gap-2">
                    <Dialog open={editOpen} onOpenChange={setEditOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                                編輯
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>編輯選單</DialogTitle>
                                <DialogDescription>
                                    修改選單資訊後儲存。
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4">
                                <div className="grid gap-3">
                                    <Label htmlFor={`title-${id}`}>標題</Label>
                                    <Input
                                        id={`title-${id}`}
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-3">
                                    <Label htmlFor={`link-${id}`}>連結網址</Label>
                                    <Input
                                        id={`link-${id}`}
                                        value={linkUrl}
                                        onChange={(e) => setLinkUrl(e.target.value)}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild disabled={saving}>
                                    <Button variant="outline">取消</Button>
                                </DialogClose>
                                <Button onClick={handleSave} disabled={saving || !title}>
                                    {saving ? '儲存中…' : '儲存'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={delOpen} onOpenChange={setDelOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                                刪除
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>確認刪除</DialogTitle>
                                <DialogDescription>
                                    此操作無法復原，確定要刪除此項目嗎？
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

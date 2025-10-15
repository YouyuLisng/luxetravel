'use client';

import React, { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { useLoadingStore } from '@/stores/useLoadingStore';

const SortableTreeAny = dynamic(
    () => import('dnd-kit-sortable-tree').then((m) => m.SortableTree),
    { ssr: false }
) as unknown as React.ComponentType<any>;

import MenuTreeItem from '../components/MenuTreeItem';
import { transformToTreeItems, flattenTree } from '../lib/menuTreeUtils';
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

export default function MenuClient() {
    const { toast } = useToast();
    const { show, hide } = useLoadingStore();

    const [items, setItems] = useState<any[]>([]);
    const [ready, setReady] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [errMsg, setErrMsg] = useState<string | null>(null);

    const [createOpen, setCreateOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newLinkUrl, setNewLinkUrl] = useState('');

    // 保留展開狀態
    const mergeCollapsed = useCallback((prev: any[], next: any[]) => {
        const map = new Map(prev.map((n) => [n.id, n]));
        return next.map((n) => {
            const p = map.get(n.id);
            return p && 'collapsed' in p ? { ...n, collapsed: p.collapsed } : n;
        });
    }, []);

    // 載入選單
    const fetchMenu = useCallback(
        async (opts: { silent?: boolean; signal?: AbortSignal } = {}) => {
            const { silent = false, signal } = opts;
            try {
                if (silent) setIsRefreshing(true);
                else show();
                setErrMsg(null);

                const res = await fetch('/api/admin/menu', {
                    signal,
                    cache: 'no-store',
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = await res.json();
                const next = transformToTreeItems(json.data);

                setItems((prev) =>
                    silent ? mergeCollapsed(prev, next) : next
                );
            } catch (e: any) {
                if (e?.name !== 'AbortError') {
                    console.error('載入選單失敗:', e);
                    setErrMsg('載入選單失敗，請稍後重試');
                }
            } finally {
                if (silent) setIsRefreshing(false);
                else hide();
                setReady(true);
            }
        },
        [mergeCollapsed, show, hide]
    );

    useEffect(() => {
        const ac = new AbortController();
        fetchMenu({ signal: ac.signal });

        const onChanged = () => fetchMenu({ silent: true });
        window.addEventListener('menu:changed', onChanged);

        return () => {
            ac.abort();
            window.removeEventListener('menu:changed', onChanged);
        };
    }, [fetchMenu]);

    // 拖曳排序（只在層級或順序變化時觸發 API）
    const handleItemsChanged = async (newItems: any[]) => {
        const oldFlat = flattenTree(items);
        const newFlat = flattenTree(newItems);

        // 檢查是否真的有 order 或 parentId 改變
        const hasOrderChanged = newFlat.some((n) => {
            const o = oldFlat.find((x) => x.id === n.id);
            return !o || o.parentId !== n.parentId || o.order !== n.order;
        });

        // 更新 UI
        setItems(newItems);

        if (!hasOrderChanged) {
            console.log('%c📁 展開/收合操作，不觸發 API', 'color: gray;');
            return;
        }

        try {
            const payload = newFlat.map((item: any) => ({
                id: String(item.id),
                parentId: item.parentId ?? null,
                order: item.order,
            }));
            const res = await fetch('/api/admin/menu/reorder', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            toast({
                variant: 'success',
                title: '順序已更新',
                duration: 1000,
            });

            // 拖曳後靜默重抓
            fetchMenu({ silent: true });
        } catch (e) {
            console.error('更新選單順序失敗:', e);
            toast({
                variant: 'destructive',
                title: '排序失敗',
                description: '請稍後再試',
                duration: 1500,
            });
        }
    };

    // 新增選單
    const handleCreate = async () => {
        try {
            setCreating(true);
            const res = await fetch('/api/admin/menu', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newTitle,
                    linkUrl: newLinkUrl || null,
                    parentId: null,
                }),
            });

            const payload = await res.json();
            if (!res.ok) throw new Error(payload?.message || '建立失敗');

            toast({
                variant: 'success',
                title: '已新增選單',
                duration: 1500,
            });

            setCreateOpen(false);
            setNewTitle('');
            setNewLinkUrl('');
            fetchMenu({ silent: true });
        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: '新增失敗',
                description: err?.message || '請稍後再試',
                duration: 1500,
            });
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="p-6 mx-auto">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold">可摺疊拖曳選單</h1>
                    {isRefreshing && (
                        <span className="inline-flex items-center text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            同步中…
                        </span>
                    )}
                </div>

                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm">新增選單</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[480px]">
                        <DialogHeader>
                            <DialogTitle>新增選單</DialogTitle>
                            <DialogDescription>
                                建立新的選單項目（預設為根層）。
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4">
                            <div className="grid gap-3">
                                <Label htmlFor="new-title">標題</Label>
                                <Input
                                    id="new-title"
                                    value={newTitle}
                                    onChange={(e) =>
                                        setNewTitle(e.target.value)
                                    }
                                />
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="new-link">連結網址</Label>
                                <Input
                                    id="new-link"
                                    value={newLinkUrl}
                                    onChange={(e) =>
                                        setNewLinkUrl(e.target.value)
                                    }
                                    placeholder="例如 /about 或 https://example.com"
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <DialogClose asChild disabled={creating}>
                                <Button variant="outline">取消</Button>
                            </DialogClose>
                            <Button
                                onClick={handleCreate}
                                disabled={creating || !newTitle}
                            >
                                {creating ? '建立中…' : '建立'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {errMsg && <p className="text-red-600">{errMsg}</p>}

            {ready && !errMsg && (
                <SortableTreeAny
                    items={items}
                    onItemsChanged={handleItemsChanged}
                    TreeItemComponent={MenuTreeItem as any}
                />
            )}
        </div>
    );
}

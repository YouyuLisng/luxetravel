'use client';

import * as React from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

type ConfirmDeleteDialogProps = {
    /** 觸發器（按鈕、圖示…），會被包在 AlertDialogTrigger asChild 內 */
    trigger?: React.ReactNode;
    /** 按下「確定」時要做的事（可回傳 Promise） */
    onConfirm: () => void | Promise<void>;
    /** 對話框標題 */
    title?: React.ReactNode;
    /** 對話框描述文字 */
    description?: React.ReactNode;
    /** 確認按鈕文字（預設：刪除） */
    confirmText?: string;
    /** 取消按鈕文字（預設：取消） */
    cancelText?: string;
    /** 禁用觸發器（例如權限不足時） */
    disabled?: boolean;

    /** 受控：開關狀態（若提供，將改用受控模式） */
    open?: boolean;
    /** 受控：變更開關 */
    onOpenChange?: (open: boolean) => void;

    /** 受控：載入狀態（若提供，handleConfirm 內不會自行 setLoading） */
    loading?: boolean;
};

export function ConfirmDeleteDialog({
    trigger,
    onConfirm,
    title = '確定要刪除嗎？',
    description = '此操作無法復原，將永久刪除資料。',
    confirmText = '刪除',
    cancelText = '取消',
    disabled,

    // 受控（可選）
    open: openProp,
    onOpenChange,
    loading: loadingProp,
}: ConfirmDeleteDialogProps) {
    // 非受控的內部 state
    const [internalOpen, setInternalOpen] = React.useState(false);
    const [internalLoading, setInternalLoading] = React.useState(false);

    // 是否受控
    const isControlledOpen = typeof openProp !== 'undefined';
    const isControlledLoading = typeof loadingProp !== 'undefined';

    // 目前狀態值
    const open = isControlledOpen ? !!openProp : internalOpen;
    const loading = isControlledLoading ? !!loadingProp : internalLoading;

    const setOpen = React.useCallback(
        (next: boolean) => {
            if (isControlledOpen) onOpenChange?.(next);
            else setInternalOpen(next);
        },
        [isControlledOpen, onOpenChange]
    );

    const setLoading = React.useCallback(
        (next: boolean) => {
            if (!isControlledLoading) setInternalLoading(next);
            // 若受控 loading，由父層負責變更，這裡不動
        },
        [isControlledLoading]
    );

    async function handleConfirm() {
        try {
            setLoading(true);
            await onConfirm();
            setOpen(false);
        } finally {
            setLoading(false);
        }
    }

    return (
        <AlertDialog
            open={open}
            onOpenChange={(o) => (!loading ? setOpen(o) : undefined)}
        >
            <AlertDialogTrigger asChild>
                <span
                    aria-disabled={disabled || loading}
                    onClick={(e) => (disabled || loading) && e.preventDefault()}
                >
                    {trigger}
                </span>
            </AlertDialogTrigger>

            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    {description ? (
                        <AlertDialogDescription>
                            {description}
                        </AlertDialogDescription>
                    ) : null}
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>
                        {cancelText}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-red-600 hover:bg-red-600/90 focus:ring-red-600"
                        onClick={handleConfirm}
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="inline-flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                處理中…
                            </span>
                        ) : (
                            confirmText
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

/** 快速版：直接給一個紅色的刪除按鈕做觸發器（非受控） */
export function DeleteButton({
    onConfirm,
    title,
    description,
    confirmText = '刪除',
    cancelText = '取消',
    children = '刪除',
    disabled,
}: Omit<ConfirmDeleteDialogProps, 'trigger'> & { children?: React.ReactNode }) {
    return (
        <ConfirmDeleteDialog
            onConfirm={onConfirm}
            title={title}
            description={description}
            confirmText={confirmText}
            cancelText={cancelText}
            disabled={disabled}
            trigger={
                <Button variant="destructive" size="sm" disabled={disabled}>
                    {children}
                </Button>
            }
        />
    );
}

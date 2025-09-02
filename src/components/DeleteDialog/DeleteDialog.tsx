"use client"
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
} from "@/components/ui/alert-dialog"

interface DeleteDialogProps {
    title: string;
    description: string;
    isOpen: boolean;
    Delete: () => void;
    onClose: () => void;
}

export function DeleteDialog({
    title,
    description,
    isOpen,
    Delete,
    onClose,
}: DeleteDialogProps) {
    return (
        <AlertDialog open={isOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="line-clamp-2">確定要刪除{title}?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onClose}>取消</AlertDialogCancel>
                    <AlertDialogAction className="bg-red-500" onClick={Delete}>刪除</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default DeleteDialog;
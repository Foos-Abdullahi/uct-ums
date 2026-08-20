import React from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmDeleteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    loading?: boolean;
    title?: string;
    description?: string;
    itemName?: string;
    confirmText?: string;
    cancelText?: string;
}

export function ConfirmDeleteDialog({
    open,
    onOpenChange,
    onConfirm,
    loading = false,
    title = 'Confirm Deletion',
    description = 'Are you sure you want to delete this record? This action cannot be undone.',
    itemName,
    confirmText = 'Delete',
    cancelText = 'Cancel',
}: ConfirmDeleteDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader className="gap-2">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
                            {itemName && (
                                <p className="mt-0.5 text-xs font-medium text-destructive">
                                    {itemName}
                                </p>
                            )}
                        </div>
                    </div>
                    <DialogDescription className="text-xs text-muted-foreground pt-1">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4 gap-2 sm:gap-0">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={loading}
                        onClick={() => onOpenChange(false)}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={loading}
                        onClick={onConfirm}
                    >
                        {loading && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                        {confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

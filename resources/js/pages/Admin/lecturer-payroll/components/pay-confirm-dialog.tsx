import { CheckCircle2, Loader2 } from 'lucide-react';
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

interface PayConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    description: string;
    loading?: boolean;
    onConfirm: () => void;
}

export function PayConfirmDialog({
    open,
    onOpenChange,
    description,
    loading = false,
    onConfirm,
}: PayConfirmDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-600">
                        <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <DialogTitle>Mark as paid?</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button size="sm" onClick={onConfirm} disabled={loading}>
                        {loading && (
                            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        )}
                        Yes, Mark as Paid
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

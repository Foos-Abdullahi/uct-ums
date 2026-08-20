import React from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { CheckSquare, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Admission } from '@/types/admission';

interface ReviewAdmissionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    admission: Admission | null;
}

export function ReviewAdmissionModal({
    open,
    onOpenChange,
    admission,
}: ReviewAdmissionModalProps) {
    const { data, setData, patch, processing, errors, reset } = useForm({
        status: admission?.status ?? 'under_review',
        review_notes: admission?.review_notes ?? '',
    });

    React.useEffect(() => {
        if (admission) {
            setData({
                status: admission.status === 'enrolled' ? 'approved' : admission.status,
                review_notes: admission.review_notes ?? '',
            });
        }
    }, [admission]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!admission) return;

        patch(`/admin/admissions/${admission.id}/status`, {
            onSuccess: () => {
                toast.success(`Application ${data.status} successfully.`);
                onOpenChange(false);
            },
            onError: () => {
                toast.error('Failed to update application review status.');
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader className="gap-2">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <CheckSquare className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-semibold">
                                    Review Application
                                </DialogTitle>
                                {admission && (
                                    <p className="text-xs text-muted-foreground">
                                        {admission.application_no} — {admission.full_name}
                                    </p>
                                )}
                            </div>
                        </div>
                        <DialogDescription className="text-xs text-muted-foreground pt-1">
                            Evaluate the admission application and record academic review decisions.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="status">Decision Status</Label>
                            <Select
                                value={data.status}
                                onValueChange={(val: any) => setData('status', val)}
                            >
                                <SelectTrigger id="status">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="under_review">Under Review</SelectItem>
                                    <SelectItem value="approved">Approve Application</SelectItem>
                                    <SelectItem value="rejected">Reject Application</SelectItem>
                                    <SelectItem value="pending">Keep as Pending</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.status && <p className="text-xs text-destructive">{errors.status}</p>}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="review_notes">Review Feedback / Decision Notes</Label>
                            <textarea
                                id="review_notes"
                                rows={4}
                                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                placeholder="Explain evaluation details, qualification checks, or rejection reasons..."
                                value={data.review_notes}
                                onChange={(e) => setData('review_notes', e.target.value)}
                            />
                            {errors.review_notes && (
                                <p className="text-xs text-destructive">{errors.review_notes}</p>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={processing}
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={processing}>
                            {processing && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                            Save Decision
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

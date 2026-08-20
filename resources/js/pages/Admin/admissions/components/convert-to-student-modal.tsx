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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Admission } from '@/types/admission';

interface ConvertToStudentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    admission: Admission | null;
}

export function ConvertToStudentModal({
    open,
    onOpenChange,
    admission,
}: ConvertToStudentModalProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        matric_no: '',
        initial_fee_amount: '1200',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!admission) return;

        post(`/admin/admissions/${admission.id}/convert`, {
            onSuccess: () => {
                toast.success('Applicant converted to student successfully.');
                reset();
                onOpenChange(false);
            },
            onError: () => {
                toast.error('Failed to convert applicant to student.');
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader className="gap-2">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10 text-purple-600">
                                <UserCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-semibold">
                                    Enroll as University Student
                                </DialogTitle>
                                {admission && (
                                    <p className="text-xs text-muted-foreground">
                                        For {admission.full_name} ({admission.application_no})
                                    </p>
                                )}
                            </div>
                        </div>
                        <DialogDescription className="text-xs text-muted-foreground pt-1">
                            This will create an official Student profile, user login account, and generate Semester 1 tuition invoice.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="matric_no">
                                Matriculation ID <span className="text-muted-foreground font-normal text-xs">(Auto-generated if empty)</span>
                            </Label>
                            <Input
                                id="matric_no"
                                placeholder="Auto-generate e.g. UCT-2026-00001"
                                value={data.matric_no}
                                onChange={(e) => setData('matric_no', e.target.value)}
                            />
                            {errors.matric_no && <p className="text-xs text-destructive">{errors.matric_no}</p>}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="initial_fee_amount">
                                Semester 1 Tuition Fee ($ USD)
                            </Label>
                            <Input
                                id="initial_fee_amount"
                                type="number"
                                step="0.01"
                                placeholder="1200.00"
                                value={data.initial_fee_amount}
                                onChange={(e) => setData('initial_fee_amount', e.target.value)}
                                required
                            />
                            {errors.initial_fee_amount && (
                                <p className="text-xs text-destructive">{errors.initial_fee_amount}</p>
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
                        <Button
                            type="submit"
                            size="sm"
                            disabled={processing}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            {processing && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                            Confirm & Enroll Student
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

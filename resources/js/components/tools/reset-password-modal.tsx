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
import { KeyRound, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export interface ResetPasswordModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    resetUrl: string;
    userName?: string;
    userIdentifier?: string;
    title?: string;
    description?: string;
    onSuccess?: () => void;
}

export function ResetPasswordModal({
    open,
    onOpenChange,
    resetUrl,
    userName,
    userIdentifier,
    title = 'Reset Password',
    description = 'Set a new secure password for this user account.',
    onSuccess,
}: ResetPasswordModalProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
        password_confirmation: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!resetUrl) return;

        post(resetUrl, {
            onSuccess: () => {
                toast.success(
                    userName
                        ? `Password reset successfully for ${userName}.`
                        : 'Password reset successfully.'
                );
                reset();
                onOpenChange(false);
                onSuccess?.();
            },
            onError: () => {
                toast.error('Failed to reset password. Please check the form errors.');
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader className="gap-2">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20">
                                <KeyRound className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-semibold">
                                    {title}
                                </DialogTitle>
                                {(userName || userIdentifier) && (
                                    <p className="text-xs text-muted-foreground">
                                        For {userName} {userIdentifier ? `(${userIdentifier})` : ''}
                                    </p>
                                )}
                            </div>
                        </div>
                        <DialogDescription className="text-xs text-muted-foreground pt-1">
                            {description}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="password">New Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter at least 8 characters"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                required
                            />
                            {errors.password && (
                                <p className="text-xs text-destructive">{errors.password}</p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation">Confirm Password</Label>
                            <Input
                                id="password_confirmation"
                                type="password"
                                placeholder="Repeat new password"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                required
                            />
                            {errors.password_confirmation && (
                                <p className="text-xs text-destructive">{errors.password_confirmation}</p>
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
                            {processing ? (
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <KeyRound className="mr-1.5 h-3.5 w-3.5" />
                            )}
                            Update Password
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default ResetPasswordModal;

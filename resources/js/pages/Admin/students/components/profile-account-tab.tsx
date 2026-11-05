import {
    Ban,
    CalendarClock,
    Check,
    CheckCircle2,
    Copy,
    KeyRound,
    LogIn,
    Mail,
    ShieldCheck,
    UserCheck,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { Student } from '@/types/student';
import { formatDate, SectionCard } from './profile-shared';

interface Props {
    student: Student;
    onResetPassword: () => void;
    onToggleStatus: () => void;
}

function ActionRow({
    icon,
    title,
    description,
    action,
}: {
    icon: ReactNode;
    title: string;
    description: string;
    action: ReactNode;
}) {
    return (
        <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            {action}
        </div>
    );
}

export function ProfileAccountTab({
    student,
    onResetPassword,
    onToggleStatus,
}: Props) {
    const [confirmSuspend, setConfirmSuspend] = useState(false);
    const [copied, setCopied] = useState(false);

    const name = student.user?.name ?? 'Unknown Student';
    const email = student.user?.email ?? '';
    const isSuspended = student.enrollment_status === 'suspended';
    const hasAccess = student.user?.is_active !== false && !isSuspended;
    const initials = name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const copyEmail = async () => {
        try {
            await navigator.clipboard.writeText(email);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            toast.error('Could not copy the email.');
        }
    };

    const timeline = [
        {
            label: 'Account created',
            value: formatDate(student.user?.created_at ?? student.created_at),
        },
        {
            label: 'Email verified',
            value: student.user?.email_verified_at
                ? formatDate(student.user.email_verified_at)
                : 'Not verified',
        },
        { label: 'Enrolled', value: formatDate(student.enrollment_date) },
        {
            label: 'Profile last updated',
            value: formatDate(student.updated_at),
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {/* Identity + access status */}
            <section className="space-y-4 rounded-lg border bg-card p-5 lg:col-span-1">
                <div className="flex flex-col items-center text-center">
                    <Avatar className="h-20 w-20 border-2 border-primary/20">
                        <AvatarImage src={student.photo_url ?? undefined} alt={name} />
                        <AvatarFallback className="bg-primary/10 text-xl font-bold text-primary">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <p className="mt-3 text-base font-semibold">{name}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                        {student.matric_no}
                    </p>
                    <Badge variant="secondary" className="mt-2">
                        Student account
                    </Badge>
                </div>

                <div
                    className={`rounded-lg border p-3 text-sm ${hasAccess ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-destructive/30 bg-destructive/10'}`}
                >
                    <p
                        className={`flex items-center gap-2 font-semibold ${hasAccess ? 'text-emerald-700 dark:text-emerald-400' : 'text-destructive'}`}
                    >
                        {hasAccess ? (
                            <CheckCircle2 className="h-4 w-4" />
                        ) : (
                            <Ban className="h-4 w-4" />
                        )}
                        {hasAccess ? 'Can sign in' : 'Sign-in blocked'}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {hasAccess
                            ? 'This student can log in to the student portal.'
                            : 'This student is suspended and cannot log in until re-activated.'}
                    </p>
                </div>

                <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                        <Mail className="h-3.5 w-3.5" />
                        Login email
                    </p>
                    <div className="mt-1 flex items-center justify-between gap-2">
                        <span className="min-w-0 truncate text-sm font-medium">
                            {email}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={copyEmail}
                            aria-label="Copy email"
                        >
                            {copied ? (
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                                <Copy className="h-3.5 w-3.5" />
                            )}
                        </Button>
                    </div>
                </div>
            </section>

            <div className="space-y-5 lg:col-span-2">
                <SectionCard
                    title="Access & security"
                    description="Actions that change how this student signs in."
                >
                    <div className="divide-y">
                        <ActionRow
                            icon={<KeyRound className="h-5 w-5" />}
                            title="Reset password"
                            description="Set a new password. Share it with the student securely."
                            action={
                                <Button variant="outline" size="sm" onClick={onResetPassword}>
                                    Reset password
                                </Button>
                            }
                        />
                        <ActionRow
                            icon={
                                isSuspended ? (
                                    <UserCheck className="h-5 w-5" />
                                ) : (
                                    <ShieldCheck className="h-5 w-5" />
                                )
                            }
                            title={isSuspended ? 'Re-activate account' : 'Suspend account'}
                            description={
                                isSuspended
                                    ? 'Restore sign-in and set enrollment back to Enrolled.'
                                    : 'Block sign-in and set enrollment to Suspended. Fully reversible.'
                            }
                            action={
                                isSuspended ? (
                                    <Button variant="outline" size="sm" onClick={onToggleStatus}>
                                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                                        Re-activate
                                    </Button>
                                ) : (
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => setConfirmSuspend(true)}
                                    >
                                        <Ban className="mr-1.5 h-3.5 w-3.5" />
                                        Suspend
                                    </Button>
                                )
                            }
                        />
                    </div>
                </SectionCard>

                <SectionCard
                    title="Account history"
                    description="Key dates for this student record."
                >
                    <ol className="relative space-y-4 border-l pl-5">
                        {timeline.map((item) => (
                            <li key={item.label} className="relative">
                                <span className="absolute top-1 -left-[25px] flex h-3 w-3 items-center justify-center rounded-full border-2 border-primary bg-card" />
                                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <CalendarClock className="h-3 w-3" />
                                    {item.label}
                                </p>
                                <p className="text-sm font-medium">{item.value}</p>
                            </li>
                        ))}
                    </ol>
                </SectionCard>
            </div>

            <Dialog open={confirmSuspend} onOpenChange={setConfirmSuspend}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <LogIn className="h-4 w-4" />
                            Suspend {name}?
                        </DialogTitle>
                        <DialogDescription>
                            They will be unable to log in until you re-activate
                            the account.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmSuspend(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                setConfirmSuspend(false);
                                onToggleStatus();
                            }}
                        >
                            Suspend account
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

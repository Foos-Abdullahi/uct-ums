import {
    CheckCircle2,
    CircleDollarSign,
    Clock3,
    FilePenLine,
    RotateCcw,
    XCircle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface ExpenseStatusGuideProps {
    className?: string;
    currentStatus?: string;
}

export function ExpenseStatusGuide({
    className,
    currentStatus,
}: ExpenseStatusGuideProps) {
    const { t } = useTranslation();
    const steps = [
        {
            status: 'draft',
            label: t('draft_status'),
            description: t('expense_flow_draft'),
            icon: FilePenLine,
        },
        {
            status: 'pending_approval',
            label: t('pending_approval_status'),
            description: t('expense_flow_pending'),
            icon: Clock3,
        },
        {
            status: 'approved',
            label: t('approved_status'),
            description: t('expense_flow_approved'),
            icon: CheckCircle2,
        },
        {
            status: 'paid',
            label: t('paid_status'),
            description: t('expense_flow_paid'),
            icon: CircleDollarSign,
        },
    ];

    return (
        <div
            className={cn('rounded-xl border bg-card p-4 shadow-sm', className)}
        >
            <div className="mb-3">
                <h3 className="text-sm font-semibold">
                    {t('expense_status_workflow')}
                </h3>
                <p className="text-xs text-muted-foreground">
                    {t('expense_status_workflow_description')}
                </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isCurrent = currentStatus === step.status;

                    return (
                        <div
                            key={step.status}
                            className={cn(
                                'relative rounded-lg border bg-background p-3',
                                isCurrent &&
                                    'border-primary bg-primary/5 ring-1 ring-primary/20',
                            )}
                        >
                            <div className="flex items-start gap-2.5">
                                <div
                                    className={cn(
                                        'rounded-full bg-muted p-1.5 text-muted-foreground',
                                        isCurrent &&
                                            'bg-primary/10 text-primary',
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold">
                                        {index + 1}. {step.label}
                                    </p>
                                    <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div
                className={cn(
                    'mt-2 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs',
                    currentStatus === 'rejected' &&
                        'ring-1 ring-destructive/30',
                )}
            >
                <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                <span>
                    <strong>{t('rejected_status')}:</strong>{' '}
                    {t('expense_flow_rejected')}
                </span>
                <RotateCcw className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
        </div>
    );
}

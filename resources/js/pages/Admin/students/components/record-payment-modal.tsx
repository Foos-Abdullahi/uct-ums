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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { StudentInvoice } from '@/types/student';

interface RecordPaymentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    studentId: number;
    invoices?: StudentInvoice[];
}

export function RecordPaymentModal({
    open,
    onOpenChange,
    studentId,
    invoices = [],
}: RecordPaymentModalProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        invoice_id: '',
        amount: '',
        payment_method: 'bank_transfer',
        payment_date: new Date().toISOString().split('T')[0],
        notes: '',
        receipt: null as File | null,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/admin/students/${studentId}/payments`, {
            onSuccess: () => {
                toast.success('Payment recorded successfully.');
                reset();
                onOpenChange(false);
            },
            onError: () => {
                toast.error('Failed to record payment. Please check the form errors.');
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader className="gap-2">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                                <CreditCard className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-semibold">
                                    Record Fee Payment
                                </DialogTitle>
                                <p className="text-xs text-muted-foreground">
                                    Process and record a student tuition or fee payment.
                                </p>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {invoices.length > 0 && (
                            <div className="grid gap-2">
                                <Label htmlFor="invoice_id">Link to Invoice (Optional)</Label>
                                <Select
                                    value={data.invoice_id}
                                    onValueChange={(val) => {
                                        setData('invoice_id', val === 'none' ? '' : val);
                                        const selected = invoices.find((inv) => String(inv.id) === val);
                                        if (selected && !data.amount) {
                                            const remaining = Math.max(0, Number(selected.amount) - Number(selected.paid_amount));
                                            if (remaining > 0) {
                                                setData((d) => ({ ...d, invoice_id: val, amount: String(remaining) }));
                                            }
                                        }
                                    }}
                                >
                                    <SelectTrigger id="invoice_id">
                                        <SelectValue placeholder="Select an outstanding invoice" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">General Payment (No specific invoice)</SelectItem>
                                        {invoices.map((inv) => (
                                            <SelectItem key={inv.id} value={String(inv.id)}>
                                                {inv.invoice_no} - {inv.title} (${Number(inv.amount).toFixed(2)})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.invoice_id && (
                                    <p className="text-xs text-destructive">{errors.invoice_id}</p>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2">
                                <Label htmlFor="amount">Amount ($ USD)</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    min="1"
                                    placeholder="1200.00"
                                    value={data.amount}
                                    onChange={(e) => setData('amount', e.target.value)}
                                    required
                                />
                                {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="payment_method">Payment Method</Label>
                                <Select
                                    value={data.payment_method}
                                    onValueChange={(val: any) => setData('payment_method', val)}
                                >
                                    <SelectTrigger id="payment_method">
                                        <SelectValue placeholder="Payment Method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                        <SelectItem value="cash">Cash Desk</SelectItem>
                                        <SelectItem value="card">Credit/Debit Card</SelectItem>
                                        <SelectItem value="online">Online / Mobile Money</SelectItem>
                                        <SelectItem value="cheque">Cheque</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.payment_method && (
                                    <p className="text-xs text-destructive">{errors.payment_method}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2">
                                <Label htmlFor="payment_date">Payment Date</Label>
                                <Input
                                    id="payment_date"
                                    type="date"
                                    value={data.payment_date}
                                    onChange={(e) => setData('payment_date', e.target.value)}
                                    required
                                />
                                {errors.payment_date && (
                                    <p className="text-xs text-destructive">{errors.payment_date}</p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="receipt">Receipt File (Optional)</Label>
                                <Input
                                    id="receipt"
                                    type="file"
                                    className="cursor-pointer text-xs"
                                    onChange={(e) => setData('receipt', e.target.files?.[0] ?? null)}
                                />
                                {errors.receipt && (
                                    <p className="text-xs text-destructive">{errors.receipt}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="notes">Notes / Reference No.</Label>
                            <Input
                                id="notes"
                                placeholder="e.g. Bank Ref #PRM-891024"
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                            />
                            {errors.notes && <p className="text-xs text-destructive">{errors.notes}</p>}
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
                        <Button type="submit" size="sm" disabled={processing} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            {processing && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                            Record Payment
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

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
import { FileUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface UploadDocumentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    studentId: number;
}

export function UploadDocumentModal({
    open,
    onOpenChange,
    studentId,
}: UploadDocumentModalProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        category: 'academic',
        file: null as File | null,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/admin/students/${studentId}/documents`, {
            onSuccess: () => {
                toast.success('Document uploaded successfully.');
                reset();
                onOpenChange(false);
            },
            onError: () => {
                toast.error('Failed to upload document. Please check the file.');
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
                                <FileUp className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-semibold">
                                    Upload Student Document
                                </DialogTitle>
                                <p className="text-xs text-muted-foreground">
                                    Attach an academic, identity, or admission document.
                                </p>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="doc_title">Document Title</Label>
                            <Input
                                id="doc_title"
                                placeholder="e.g. High School Transcript"
                                value={data.title}
                                onChange={(e) => setData('title', e.target.value)}
                                required
                            />
                            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="category">Category</Label>
                            <Select
                                value={data.category}
                                onValueChange={(val) => setData('category', val)}
                            >
                                <SelectTrigger id="category">
                                    <SelectValue placeholder="Select Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="academic">Academic (Transcripts, Certificates)</SelectItem>
                                    <SelectItem value="identity">Identity (Passport, National ID)</SelectItem>
                                    <SelectItem value="admission">Admission (Application, Recommendation)</SelectItem>
                                    <SelectItem value="financial">Financial (Proof of Payment, Sponsor)</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.category && (
                                <p className="text-xs text-destructive">{errors.category}</p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="doc_file">Document File (PDF, Images up to 10MB)</Label>
                            <Input
                                id="doc_file"
                                type="file"
                                className="cursor-pointer text-xs"
                                onChange={(e) => setData('file', e.target.files?.[0] ?? null)}
                                required
                            />
                            {errors.file && <p className="text-xs text-destructive">{errors.file}</p>}
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
                            Upload Document
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

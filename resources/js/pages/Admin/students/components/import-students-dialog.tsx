import {
    AlertCircle,
    ArrowDownToLine,
    CheckCircle2,
    FileSpreadsheet,
    Loader2,
} from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { FileUploader } from '@/components/tools/file-uploader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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

interface ImportResult {
    imported: number;
    failed: number;
    errors: string[];
}

interface ImportStudentsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImported: () => void;
    programs: { id: number; name: string }[];
}

function getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);

    if (parts.length === 2) {
        return decodeURIComponent(parts.pop()?.split(';').shift() ?? '');
    }

    return null;
}

export function ImportStudentsDialog({
    open,
    onOpenChange,
    onImported,
    programs,
}: ImportStudentsDialogProps) {
    const [file, setFile] = useState<File | null>(null);
    const [program, setProgram] = useState('');
    const [processing, setProcessing] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);

    const resetState = useCallback(() => {
        setFile(null);
        setProgram('');
        setResult(null);
    }, []);

    const handleImport = async () => {
        if (!file) {
            toast.error('Please select an Excel file to import.');

            return;
        }

        setProcessing(true);
        setResult(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('program', program);

        try {
            const response = await fetch('/admin/students/import', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') ?? '',
                },
                body: formData,
            });

            if (!response.ok) {
                let serverErrors: string[] = [];

                try {
                    const payload = await response.json();

                    if (typeof payload === 'object' && payload !== null) {
                        if (Array.isArray(payload.errors)) {
                            serverErrors = payload.errors;
                        } else if (payload.errors?.file) {
                            serverErrors = payload.errors.file;
                        }
                    }
                } catch {
                    serverErrors = ['Failed to read the server response.'];
                }

                setResult({ imported: 0, failed: 0, errors: serverErrors });
                setProcessing(false);

                return;
            }

            const data = (await response.json()) as ImportResult;
            setResult(data);

            if (data.imported > 0) {
                toast.success(
                    `${data.imported} student(s) imported successfully.`,
                );
                onImported();
            }

            if (data.failed > 0) {
                toast.error(
                    `${data.failed} row(s) failed. Review the errors below.`,
                );
            }
        } catch {
            setResult({
                imported: 0,
                failed: 0,
                errors: ['A network error occurred. Please try again.'],
            });
            toast.error('Import failed. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    const handleOpenChange = (next: boolean) => {
        onOpenChange(next);

        if (!next) {
            resetState();
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[560px]">
                <DialogHeader className="gap-2">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <FileSpreadsheet className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-semibold">
                                Import Students
                            </DialogTitle>
                            <DialogDescription>
                                Upload an Excel (.xlsx) file to bulk-register
                                students into the system.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="py-2">
                    <a
                        href="/templates/UCC_Student_Import_Template.xlsx"
                        download
                        className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                    >
                        <ArrowDownToLine className="h-3.5 w-3.5" />
                        Download the import template (.xlsx)
                    </a>
                </div>

                <FileUploader
                    accept={['.xlsx']}
                    maxSizeMB={5}
                    maxFiles={1}
                    description="Only .xlsx files up to 5MB"
                    onFilesChange={(files) => setFile(files[0] ?? null)}
                />

                <div className="space-y-1.5">
                    <Label htmlFor="import-program" className="text-xs">
                        Program{' '}
                        <span className="font-normal text-muted-foreground">
                            (required when the file has no Program column)
                        </span>
                    </Label>
                    <Select
                        value={program}
                        onValueChange={setProgram}
                        disabled={processing}
                    >
                        <SelectTrigger id="import-program">
                            <SelectValue placeholder="Not specified — use the Program column in the file" />
                        </SelectTrigger>
                        <SelectContent>
                            {programs.map((option) => (
                                <SelectItem key={option.id} value={option.name}>
                                    {option.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {result && (
                    <div className="space-y-3">
                        <Alert
                            variant={
                                result.failed > 0 ? 'destructive' : 'default'
                            }
                        >
                            <AlertCircle
                                className={
                                    result.failed > 0
                                        ? 'h-4 w-4'
                                        : 'h-4 w-4 text-emerald-600'
                                }
                            />
                            <AlertTitle className="text-sm">
                                {result.failed > 0 ? (
                                    <>
                                        Import complete: {result.imported}{' '}
                                        imported, {result.failed} failed.
                                    </>
                                ) : (
                                    <>
                                        <span className="text-emerald-600">
                                            All {result.imported} student(s)
                                            imported successfully.
                                        </span>
                                    </>
                                )}
                            </AlertTitle>
                            {result.errors.length > 0 && (
                                <AlertDescription className="text-xs">
                                    <ul className="max-h-40 space-y-1 overflow-y-auto pr-2">
                                        {result.errors.map((error, idx) => (
                                            <li key={`${error}-${idx}`}>
                                                - {error}
                                            </li>
                                        ))}
                                    </ul>
                                </AlertDescription>
                            )}
                        </Alert>
                    </div>
                )}

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={processing}
                        onClick={() => handleOpenChange(false)}
                    >
                        {result ? 'Done' : 'Cancel'}
                    </Button>
                    {!result && (
                        <Button
                            type="button"
                            size="sm"
                            disabled={processing || !file}
                            onClick={handleImport}
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                    Importing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                                    Import Students
                                </>
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

import { Head } from '@inertiajs/react';
import { Download, File, FileText, FolderOpen } from 'lucide-react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { Student, StudentDocument } from '@/types/student';

interface Props {
    student: Student;
    documents: StudentDocument[];
}

const categoryColors: Record<string, string> = {
    admission: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    identity: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    academic: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    financial: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    other: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

function formatFileSize(bytes: number | null | undefined): string {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function StudentDocumentsIndex({ student, documents }: Props) {
    const grouped = documents.reduce<Record<string, StudentDocument[]>>((acc, doc) => {
        const key = doc.category ?? 'other';
        if (!acc[key]) acc[key] = [];
        acc[key].push(doc);
        return acc;
    }, {});

    return (
        <>
            <Head title="My Documents" />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <Heading
                    title="My Documents"
                    description="All documents linked to your student record."
                />

                {documents.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                            <FolderOpen className="h-12 w-12 stroke-1 mb-3 text-muted-foreground/60" />
                            <h3 className="text-base font-semibold text-foreground">No documents found</h3>
                            <p className="text-sm mt-1">
                                Contact the registrar to have documents uploaded to your record.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Category summary */}
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(grouped).map(([category, docs]) => (
                                <div
                                    key={category}
                                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium capitalize ${categoryColors[category] ?? categoryColors.other}`}
                                >
                                    <File className="h-3 w-3" />
                                    {category} ({docs.length})
                                </div>
                            ))}
                        </div>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">
                                    All Documents ({documents.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Title</TableHead>
                                                <TableHead>Category</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Size</TableHead>
                                                <TableHead>Date Added</TableHead>
                                                <TableHead className="w-[80px]" />
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {documents.map((doc) => (
                                                <TableRow key={doc.id}>
                                                    <TableCell className="text-xs font-medium">
                                                        <div className="flex items-center gap-2">
                                                            <FileText className="h-4 w-4 text-primary shrink-0" />
                                                            {doc.title}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span
                                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${categoryColors[doc.category] ?? categoryColors.other}`}
                                                        >
                                                            {doc.category}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground uppercase">
                                                        {doc.file_type ?? '—'}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">
                                                        {formatFileSize(doc.file_size)}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">
                                                        {new Date(doc.created_at).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button asChild variant="ghost" size="sm" className="h-7 px-2">
                                                            <a
                                                                href={`/storage/${doc.file_path}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                download
                                                            >
                                                                <Download className="h-3.5 w-3.5" />
                                                            </a>
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </>
    );
}

StudentDocumentsIndex.layout = {
    breadcrumbs: [{ title: 'Documents', href: '/student/documents' }],
};

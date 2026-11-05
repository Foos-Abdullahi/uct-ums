import { Award, Download, FileText, FileUp, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Student } from '@/types/student';
import { formatDate, SectionCard } from './profile-shared';

interface Props {
    student: Student;
    onUpload: () => void;
    onIssueCertificate: () => void;
    onDeleteDocument: (id: number) => void;
}

export function ProfileDocumentsTab({
    student,
    onUpload,
    onIssueCertificate,
    onDeleteDocument,
}: Props) {
    const documents = student.documents ?? [];
    const certificates = student.certificates ?? [];

    return (
        <div className="space-y-5">
            <SectionCard
                title="Documents"
                description="Admission records, IDs and supporting files."
                action={
                    <Button size="sm" onClick={onUpload}>
                        <FileUp className="mr-1.5 h-3.5 w-3.5" />
                        Upload
                    </Button>
                }
            >
                {documents.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                        <FileText className="mx-auto mb-2 h-7 w-7 opacity-40" />
                        No documents uploaded yet.
                    </p>
                ) : (
                    <ul className="divide-y">
                        {documents.map((doc) => (
                            <li
                                key={doc.id}
                                className="flex items-center gap-3 py-2.5"
                            >
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
                                    <FileText className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium">
                                        {doc.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground capitalize">
                                        {doc.category} · {formatDate(doc.created_at)}
                                        {doc.file_size
                                            ? ` · ${(doc.file_size / 1024).toFixed(0)} KB`
                                            : ''}
                                    </p>
                                </div>
                                <Button asChild variant="outline" size="sm" className="h-8">
                                    <a
                                        href={`/storage/${doc.file_path}`}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        <Download className="mr-1.5 h-3.5 w-3.5" />
                                        Open
                                    </a>
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    aria-label={`Delete ${doc.title}`}
                                    onClick={() => onDeleteDocument(doc.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
            </SectionCard>

            <SectionCard
                title="Certificates"
                description="Degrees, diplomas and honors issued by the university."
                action={
                    <Button size="sm" variant="outline" onClick={onIssueCertificate}>
                        <Award className="mr-1.5 h-3.5 w-3.5" />
                        Issue certificate
                    </Button>
                }
            >
                {certificates.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                        <Award className="mx-auto mb-2 h-7 w-7 opacity-40" />
                        No certificates issued yet.
                    </p>
                ) : (
                    <ul className="divide-y">
                        {certificates.map((cert) => (
                            <li
                                key={cert.id}
                                className="flex items-center gap-3 py-2.5"
                            >
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    <Award className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium">
                                        {cert.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        <span className="font-mono">
                                            {cert.certificate_no}
                                        </span>{' '}
                                        · <span className="capitalize">{cert.type}</span> ·
                                        Issued {formatDate(cert.issue_date)}
                                    </p>
                                </div>
                                <Badge
                                    variant="outline"
                                    className={
                                        cert.status === 'active'
                                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
                                            : 'border-destructive/30 bg-destructive/10 text-destructive'
                                    }
                                >
                                    {cert.status}
                                </Badge>
                            </li>
                        ))}
                    </ul>
                )}
            </SectionCard>
        </div>
    );
}

import { Head } from '@inertiajs/react';
import { Award, Download, ScrollText } from 'lucide-react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import type { Student, StudentCertificate } from '@/types/student';

interface Props {
    student: Student;
    certificates: StudentCertificate[];
}

const typeColors: Record<string, string> = {
    degree: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    diploma: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    completion: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    honor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    other: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

export default function StudentCertificatesIndex({ student, certificates }: Props) {
    return (
        <>
            <Head title="My Certificates" />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <Heading
                    title="My Certificates"
                    description="Official certificates and credentials issued by the institution."
                />

                {certificates.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                            <ScrollText className="h-12 w-12 stroke-1 mb-3 text-muted-foreground/60" />
                            <h3 className="text-base font-semibold text-foreground">No certificates yet</h3>
                            <p className="text-sm mt-1">
                                Certificates will appear here once they are issued by the institution.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {certificates.map((cert) => (
                            <Card
                                key={cert.id}
                                className={`overflow-hidden hover:border-primary/50 transition-colors ${cert.status === 'revoked' ? 'opacity-60' : ''}`}
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div
                                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${typeColors[cert.type] ?? typeColors.other}`}
                                        >
                                            <Award className="h-3 w-3" />
                                            {cert.type}
                                        </div>
                                        <Badge
                                            variant={cert.status === 'active' ? 'default' : 'destructive'}
                                            className="capitalize text-[10px]"
                                        >
                                            {cert.status}
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-base line-clamp-2 mt-2">
                                        {cert.title}
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="pt-0 space-y-3">
                                    <div className="text-xs text-muted-foreground space-y-1">
                                        <div className="flex justify-between">
                                            <span>Certificate No.</span>
                                            <span className="font-mono font-semibold text-foreground">
                                                {cert.certificate_no}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Issue Date</span>
                                            <span className="font-medium text-foreground">
                                                {new Date(cert.issue_date).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                })}
                                            </span>
                                        </div>
                                    </div>

                                    {cert.file_path && cert.status === 'active' && (
                                        <Button asChild variant="outline" size="sm" className="w-full text-xs h-8">
                                            <a
                                                href={`/storage/${cert.file_path}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                download
                                            >
                                                <Download className="mr-2 h-3.5 w-3.5" />
                                                Download Certificate
                                            </a>
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

StudentCertificatesIndex.layout = {
    breadcrumbs: [{ title: 'Certificates', href: '/student/certificates' }],
};

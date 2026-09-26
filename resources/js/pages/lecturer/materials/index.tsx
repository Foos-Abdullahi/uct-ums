import { Head, router } from '@inertiajs/react';
import {
    Download,
    FileText,
    PlusCircle,
    Search,
    Trash2,
    Upload,
} from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { Textarea } from '@/components/ui/textarea';
import type { Course, CourseMaterial } from '@/types/lecturer';

const CATEGORIES = [
    { value: 'syllabus', label: 'Course Syllabus' },
    { value: 'lecture_notes', label: 'Lecture Notes / Slides' },
    { value: 'assignment', label: 'Assignment Brief' },
    { value: 'lab_manual', label: 'Lab Manual' },
    { value: 'reading', label: 'Required Reading' },
    { value: 'other', label: 'Other Resource' },
];

interface Props {
    materials: CourseMaterial[];
    courses: Course[];
    filters: {
        course_id: string;
        category: string;
        search: string;
    };
}

export default function LecturerMaterialsIndex({
    materials,
    courses,
    filters,
}: Props) {
    const [search, setSearch] = useState(filters.search);
    const [courseId, setCourseId] = useState(filters.course_id);
    const [category, setCategory] = useState(filters.category);

    // Upload modal state
    const [isOpen, setIsOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadForm, setUploadForm] = useState({
        course_id: courses[0]?.id ? String(courses[0].id) : '',
        title: '',
        description: '',
        category: 'lecture_notes',
        file: null as File | null,
    });

    const handleFilter = (newFilters: Partial<typeof filters>) => {
        const query = {
            search,
            course_id: courseId,
            category,
            ...newFilters,
        };

        router.get('/lecturer/materials', query, {
            preserveState: true,
            replace: true,
        });
    };

    const handleUpload = (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadForm.file || !uploadForm.course_id || !uploadForm.title) return;

        setIsUploading(true);

        const formData = new FormData();
        formData.append('course_id', uploadForm.course_id);
        formData.append('title', uploadForm.title);
        formData.append('description', uploadForm.description);
        formData.append('category', uploadForm.category);
        formData.append('file', uploadForm.file);

        router.post('/lecturer/materials', formData, {
            forceFormData: true,
            onSuccess: () => {
                setIsOpen(false);
                setUploadForm({
                    course_id: courses[0]?.id ? String(courses[0].id) : '',
                    title: '',
                    description: '',
                    category: 'lecture_notes',
                    file: null,
                });
            },
            onFinish: () => setIsUploading(false),
        });
    };

    const handleDelete = (materialId: number) => {
        if (confirm('Are you sure you want to delete this course material?')) {
            router.delete(`/lecturer/materials/${materialId}`);
        }
    };

    const formatFileSize = (bytes: number | null) => {
        if (!bytes) return '—';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <>
            <Head title="Course Materials" />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <Heading
                        title="Course Materials Library"
                        description="Upload, organize, and share lecture slides, syllabi, readings, and assignment briefs with students."
                    />

                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="w-fit">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Upload Material
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <form onSubmit={handleUpload}>
                                <DialogHeader>
                                    <DialogTitle>Upload Course Material</DialogTitle>
                                    <DialogDescription className="text-xs">
                                        Distribute learning assets to enrolled students.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-3 py-4 text-xs">
                                    <div className="space-y-1">
                                        <Label htmlFor="course" className="text-xs">
                                            Target Course <span className="text-destructive">*</span>
                                        </Label>
                                        <Select
                                            value={uploadForm.course_id}
                                            onValueChange={(val) =>
                                                setUploadForm((p) => ({ ...p, course_id: val }))
                                            }
                                        >
                                            <SelectTrigger className="text-xs">
                                                <SelectValue placeholder="Select course" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {courses.map((c) => (
                                                    <SelectItem key={c.id} value={String(c.id)}>
                                                        {c.code} - {c.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="category" className="text-xs">
                                            Resource Category <span className="text-destructive">*</span>
                                        </Label>
                                        <Select
                                            value={uploadForm.category}
                                            onValueChange={(val) =>
                                                setUploadForm((p) => ({ ...p, category: val }))
                                            }
                                        >
                                            <SelectTrigger className="text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {CATEGORIES.map((cat) => (
                                                    <SelectItem key={cat.value} value={cat.value}>
                                                        {cat.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="title" className="text-xs">
                                            Title / Topic <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="title"
                                            placeholder="e.g. Chapter 4 - Architectural Styles"
                                            value={uploadForm.title}
                                            onChange={(e) =>
                                                setUploadForm((p) => ({ ...p, title: e.target.value }))
                                            }
                                            className="text-xs"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="description" className="text-xs">
                                            Description / Instructions (optional)
                                        </Label>
                                        <Textarea
                                            id="description"
                                            placeholder="Add student instructions, deadline, or chapter readings..."
                                            value={uploadForm.description}
                                            onChange={(e) =>
                                                setUploadForm((p) => ({ ...p, description: e.target.value }))
                                            }
                                            className="text-xs min-h-[60px]"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="file" className="text-xs">
                                            File Attachment <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="file"
                                            type="file"
                                            onChange={(e) =>
                                                setUploadForm((p) => ({
                                                    ...p,
                                                    file: e.target.files ? e.target.files[0] : null,
                                                }))
                                            }
                                            className="text-xs"
                                            required
                                        />
                                        <p className="text-[10px] text-muted-foreground mt-1">
                                            Supports PDF, DOCX, PPTX, XLSX, ZIP up to 20MB.
                                        </p>
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" size="sm" disabled={isUploading}>
                                        <Upload className="mr-2 h-4 w-4" />
                                        {isUploading ? 'Uploading...' : 'Publish Material'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by title, description, filename..."
                            className="pl-9 text-sm"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                handleFilter({ search: e.target.value });
                            }}
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Select
                            value={courseId}
                            onValueChange={(val) => {
                                setCourseId(val);
                                handleFilter({ course_id: val });
                            }}
                        >
                            <SelectTrigger className="w-[180px] text-xs">
                                <SelectValue placeholder="All Courses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All My Courses</SelectItem>
                                {courses.map((c) => (
                                    <SelectItem key={c.id} value={String(c.id)}>
                                        {c.code} - {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={category}
                            onValueChange={(val) => {
                                setCategory(val);
                                handleFilter({ category: val });
                            }}
                        >
                            <SelectTrigger className="w-[180px] text-xs">
                                <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {CATEGORIES.map((cat) => (
                                    <SelectItem key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Materials List */}
                {materials.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                            <FileText className="h-12 w-12 stroke-1 mb-3 text-muted-foreground/60" />
                            <h3 className="text-base font-semibold text-foreground">No course materials found</h3>
                            <p className="text-sm mt-1">Upload syllabus files, slides, or documents to share with your students.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {materials.map((mat) => (
                            <Card key={mat.id} className="flex flex-col justify-between overflow-hidden hover:border-primary/50 transition-all">
                                <div>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <Badge variant="outline" className="text-[10px] uppercase font-mono">
                                                {mat.course?.code}
                                            </Badge>
                                            <Badge variant="secondary" className="text-[10px] capitalize">
                                                {mat.category.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                        <CardTitle className="text-base line-clamp-1 mt-2">
                                            {mat.title}
                                        </CardTitle>
                                        <CardDescription className="text-xs line-clamp-2">
                                            {mat.description || mat.course?.name}
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent className="space-y-1.5 pt-0 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1.5 truncate">
                                            <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                                            <span className="truncate">{mat.file_name}</span>
                                        </div>
                                        <div className="text-[11px]">
                                            Size: {formatFileSize(mat.file_size)} &bull; Uploaded: {new Date(mat.created_at).toLocaleDateString()}
                                        </div>
                                    </CardContent>
                                </div>

                                <div className="p-4 pt-0 border-t bg-muted/20 flex items-center justify-between mt-4">
                                    <Button asChild variant="outline" size="sm" className="text-xs h-8">
                                        <a href={`/lecturer/materials/${mat.id}/download`}>
                                            <Download className="mr-1.5 h-3.5 w-3.5" />
                                            Download
                                        </a>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(mat.id)}
                                        className="h-8 text-xs text-destructive hover:bg-destructive/10"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

LecturerMaterialsIndex.layout = {
    breadcrumbs: [{ title: 'Materials', href: '/lecturer/materials' }],
};

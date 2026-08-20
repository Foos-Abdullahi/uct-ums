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
import { BookOpen, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AddGradeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    studentId: number;
    defaultSemester?: number;
}

export function AddGradeModal({
    open,
    onOpenChange,
    studentId,
    defaultSemester = 1,
}: AddGradeModalProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        course_code: '',
        course_name: '',
        semester: defaultSemester,
        credits: 3,
        grade: 'A',
        grade_point: '4.00',
        status: 'passed',
    });

    const gradeMap: Record<string, string> = {
        'A': '4.00',
        'A-': '3.67',
        'B+': '3.33',
        'B': '3.00',
        'B-': '2.67',
        'C+': '2.33',
        'C': '2.00',
        'C-': '1.67',
        'D': '1.00',
        'F': '0.00',
    };

    const handleGradeChange = (grade: string) => {
        const point = gradeMap[grade] || '0.00';
        const isF = grade === 'F';
        setData((d) => ({
            ...d,
            grade,
            grade_point: point,
            status: isF ? 'failed' : 'passed',
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/admin/students/${studentId}/grades`, {
            onSuccess: () => {
                toast.success('Course grade added successfully.');
                reset();
                onOpenChange(false);
            },
            onError: () => {
                toast.error('Failed to add course grade.');
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader className="gap-2">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <BookOpen className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-semibold">
                                    Record Course Grade
                                </DialogTitle>
                                <p className="text-xs text-muted-foreground">
                                    Add academic course results to student transcript.
                                </p>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-3 gap-3">
                            <div className="grid gap-2">
                                <Label htmlFor="course_code">Course Code</Label>
                                <Input
                                    id="course_code"
                                    placeholder="e.g. CS201"
                                    value={data.course_code}
                                    onChange={(e) => setData('course_code', e.target.value.toUpperCase())}
                                    required
                                />
                                {errors.course_code && (
                                    <p className="text-xs text-destructive">{errors.course_code}</p>
                                )}
                            </div>

                            <div className="col-span-2 grid gap-2">
                                <Label htmlFor="course_name">Course Name</Label>
                                <Input
                                    id="course_name"
                                    placeholder="e.g. Data Structures & Algorithms"
                                    value={data.course_name}
                                    onChange={(e) => setData('course_name', e.target.value)}
                                    required
                                />
                                {errors.course_name && (
                                    <p className="text-xs text-destructive">{errors.course_name}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2">
                                <Label htmlFor="semester">Semester</Label>
                                <Input
                                    id="semester"
                                    type="number"
                                    min="1"
                                    max="12"
                                    value={data.semester}
                                    onChange={(e) => setData('semester', parseInt(e.target.value) || 1)}
                                    required
                                />
                                {errors.semester && (
                                    <p className="text-xs text-destructive">{errors.semester}</p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="credits">Credit Hours</Label>
                                <Input
                                    id="credits"
                                    type="number"
                                    min="1"
                                    max="6"
                                    value={data.credits}
                                    onChange={(e) => setData('credits', parseInt(e.target.value) || 3)}
                                    required
                                />
                                {errors.credits && (
                                    <p className="text-xs text-destructive">{errors.credits}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div className="grid gap-2">
                                <Label htmlFor="grade">Grade</Label>
                                <Select
                                    value={data.grade}
                                    onValueChange={handleGradeChange}
                                >
                                    <SelectTrigger id="grade">
                                        <SelectValue placeholder="Grade" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.keys(gradeMap).map((g) => (
                                            <SelectItem key={g} value={g}>
                                                {g} ({gradeMap[g]})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.grade && (
                                    <p className="text-xs text-destructive">{errors.grade}</p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="grade_point">Grade Point</Label>
                                <Input
                                    id="grade_point"
                                    type="number"
                                    step="0.01"
                                    value={data.grade_point}
                                    onChange={(e) => setData('grade_point', e.target.value)}
                                    required
                                />
                                {errors.grade_point && (
                                    <p className="text-xs text-destructive">{errors.grade_point}</p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="status">Result Status</Label>
                                <Select
                                    value={data.status}
                                    onValueChange={(val: any) => setData('status', val)}
                                >
                                    <SelectTrigger id="status">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="passed">Passed</SelectItem>
                                        <SelectItem value="failed">Failed</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.status && (
                                    <p className="text-xs text-destructive">{errors.status}</p>
                                )}
                            </div>
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
                            Record Grade
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

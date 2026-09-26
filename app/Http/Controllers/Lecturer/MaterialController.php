<?php

namespace App\Http\Controllers\Lecturer;

use App\Models\Course;
use App\Models\CourseMaterial;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MaterialController extends LecturerBaseController
{
    /**
     * Display course materials library.
     */
    public function index(Request $request): Response
    {
        $lecturer = $this->getLecturer($request);

        $assignedCourses = Course::query()
            ->whereHas('assignments', function ($q) use ($lecturer) {
                $q->where('lecturer_id', $lecturer->id);
            })
            ->with('program')
            ->get();

        $courseId = $request->query('course_id');
        $category = $request->query('category');
        $search = $request->query('search');

        $materials = CourseMaterial::query()
            ->with(['course.program'])
            ->where('lecturer_id', $lecturer->id)
            ->filterCourse($courseId)
            ->filterCategory($category)
            ->search($search)
            ->latest('id')
            ->get();

        return Inertia::render('lecturer/materials/index', [
            'materials' => $materials,
            'courses' => $assignedCourses,
            'filters' => [
                'course_id' => $courseId ?? 'all',
                'category' => $category ?? 'all',
                'search' => $search ?? '',
            ],
        ]);
    }

    /**
     * Store a newly uploaded course material.
     */
    public function store(Request $request): RedirectResponse
    {
        $lecturer = $this->getLecturer($request);

        $validated = $request->validate([
            'course_id' => ['required', 'exists:courses,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'category' => ['required', 'string', 'in:syllabus,lecture_notes,assignment,lab_manual,reading,other'],
            'academic_year' => ['nullable', 'string', 'max:20'],
            'semester' => ['nullable', 'string', 'max:50'],
            'file' => ['required', 'file', 'max:20480', 'mimes:pdf,doc,docx,ppt,pptx,xls,xlsx,zip,rar,txt,png,jpg,jpeg'],
        ]);

        $course = Course::findOrFail($validated['course_id']);

        $isAssigned = $course->assignments()
            ->where('lecturer_id', $lecturer->id)
            ->exists();

        if (! $isAssigned) {
            abort(403, 'You are not assigned to teach this course.');
        }

        $file = $request->file('file');
        $path = $file->store('materials', 'public');

        CourseMaterial::create([
            'course_id' => $course->id,
            'lecturer_id' => $lecturer->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'category' => $validated['category'],
            'file_path' => $path,
            'file_name' => $file->getClientOriginalName(),
            'file_size' => $file->getSize(),
            'file_type' => $file->getClientOriginalExtension(),
            'academic_year' => $validated['academic_year'] ?? null,
            'semester' => $validated['semester'] ?? null,
            'is_published' => true,
        ]);

        return back()->with('success', 'Course material uploaded successfully.');
    }

    /**
     * Download the specified course material file.
     */
    public function download(Request $request, CourseMaterial $material): StreamedResponse
    {
        $lecturer = $this->getLecturer($request);

        // Verify assignment or ownership
        if ($material->lecturer_id !== $lecturer->id) {
            $isAssigned = Course::where('id', $material->course_id)
                ->whereHas('assignments', fn ($q) => $q->where('lecturer_id', $lecturer->id))
                ->exists();

            if (! $isAssigned) {
                abort(403);
            }
        }

        if (! Storage::disk('public')->exists($material->file_path)) {
            abort(404, 'File not found on storage.');
        }

        return Storage::disk('public')->download($material->file_path, $material->file_name ?? basename($material->file_path));
    }

    /**
     * Delete the specified course material.
     */
    public function destroy(Request $request, CourseMaterial $material): RedirectResponse
    {
        $lecturer = $this->getLecturer($request);

        if ($material->lecturer_id !== $lecturer->id) {
            abort(403, 'Unauthorized to delete this material.');
        }

        if ($material->file_path && Storage::disk('public')->exists($material->file_path)) {
            Storage::disk('public')->delete($material->file_path);
        }

        $material->delete();

        return back()->with('success', 'Course material deleted successfully.');
    }
}

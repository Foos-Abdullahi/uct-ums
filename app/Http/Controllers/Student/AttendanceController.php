<?php

namespace App\Http\Controllers\Student;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceController extends StudentBaseController
{
    /**
     * Display the student's attendance records with per-course summaries.
     */
    public function index(Request $request): Response
    {
        $student = $this->getStudent($request);

        $courseFilter = $request->query('course');

        $attendancesQuery = $student->attendances()->with('course');

        if ($courseFilter && $courseFilter !== 'all') {
            $attendancesQuery->where(function ($q) use ($courseFilter) {
                $q->where('course_id', $courseFilter)
                    ->orWhere('course_name', $courseFilter);
            });
        }

        $attendances = $attendancesQuery->orderByDesc('date')->get();

        // Per-course summaries
        $allAttendances = $student->attendances()->with('course')->get();

        $courseSummaries = $allAttendances
            ->groupBy(fn ($a) => $a->course?->name ?? $a->course_name)
            ->map(function ($records, $courseName) {
                $total = $records->count();
                $present = $records->where('status', 'present')->count();
                $late = $records->where('status', 'late')->count();
                $absent = $records->where('status', 'absent')->count();
                $excused = $records->where('status', 'excused')->count();
                $rate = $total > 0 ? round((($present + $late) / $total) * 100, 1) : null;

                return [
                    'course_name' => $courseName,
                    'course_code' => $records->first()?->course?->code,
                    'total' => $total,
                    'present' => $present,
                    'late' => $late,
                    'absent' => $absent,
                    'excused' => $excused,
                    'rate' => $rate,
                ];
            })
            ->values();

        // Overall rate
        $totalAll = $allAttendances->count();
        $presentAll = $allAttendances->whereIn('status', ['present', 'late'])->count();
        $overallRate = $totalAll > 0 ? round(($presentAll / $totalAll) * 100, 1) : null;

        // Unique course names for filter
        $availableCourses = $allAttendances
            ->map(fn ($a) => [
                'id' => $a->course_id,
                'name' => $a->course?->name ?? $a->course_name,
            ])
            ->unique('name')
            ->values();

        return Inertia::render('Student/attendance/index', [
            'student' => $student,
            'attendances' => $attendances,
            'course_summaries' => $courseSummaries,
            'overall_rate' => $overallRate,
            'total_sessions' => $totalAll,
            'available_courses' => $availableCourses,
            'filters' => [
                'course' => $courseFilter ?? 'all',
            ],
        ]);
    }
}

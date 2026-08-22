export interface CourseAssignment {
    id: number;
    lecturer_id: number;
    course_id: number;
    academic_year: string;
    semester: string;
    section: string;
    role: 'lead_lecturer' | 'co_lecturer' | 'assistant' | 'lab_instructor';
    status: 'assigned' | 'active' | 'completed' | 'cancelled';
    workload_hours: number;
    room: string | null;
    schedule_day: string | null;
    schedule_time: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;

    // Relationships (populated by the backend)
    lecturer?: {
        id: number;
        user: { name: string; email: string };
        lecturer_no: string;
    };
    course?: {
        id: number;
        code: string;
        name: string;
        credit_hours: number;
    };
}

export interface AssignmentStats {
    total_assignments: number;
    active_assignments: number;
    completed_assignments: number;
    cancelled_assignments: number;
    assigned_assignments: number;
}

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}
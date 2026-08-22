import type { User } from './auth';

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

export interface Lecturer {
    id: number;
    user_id: number;
    lecturer_no: string;
    department: string | null;
    faculty: string | null;
    designation: string;
    qualification: string | null;
    specialization: string | null;
    phone: string | null;
    gender: string | null;
    date_of_birth: string | null;
    address: string | null;
    hire_date: string | null;
    employment_status: 'active' | 'on_leave' | 'sabbatical' | 'terminated';
    contract_type: 'full_time' | 'part_time' | 'adjunct' | 'visiting';
    office_location: string | null;
    bio: string | null;
    created_at: string;
    updated_at: string;
    user?: User;
    course_assignments?: CourseAssignment[];
}

export interface Course {
    id: number;
    program_id: number | null;
    code: string;
    name: string;
    credit_hours: number;
    semester: number;
    level: string;
    description: string | null;
    status: 'active' | 'inactive';
    program?: {
        id: number;
        name: string;
    };
}

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
    lecturer?: Lecturer;
    course?: Course;
}

export interface LecturerStats {
    total_lecturers: number;
    active_lecturers: number;
    on_leave_lecturers: number;
    full_time_lecturers: number;
    part_time_lecturers: number;
}

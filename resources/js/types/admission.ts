import type { Program, Student } from './student';

export type AdmissionStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'enrolled';

export interface Admission {
    id: number;
    application_no: string;
    first_name: string;
    last_name: string;
    full_name: string;
    email: string;
    phone?: string | null;
    gender?: string | null;
    date_of_birth?: string | null;
    address?: string | null;
    program_id?: number | null;
    entry_semester?: string | null;
    previous_qualification?: string | null;
    previous_gpa?: number | string | null;
    status: AdmissionStatus;
    application_date: string;
    notes?: string | null;
    review_notes?: string | null;
    student_id?: number | null;
    created_at: string;
    updated_at: string;
    program?: Program;
    student?: Student;
}

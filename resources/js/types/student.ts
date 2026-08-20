import type { UserRole } from './auth';

export type EnrollmentStatus = 'enrolled' | 'pending' | 'suspended' | 'graduated' | 'withdrawn';
export type StudentFeeStatus = 'paid' | 'unpaid' | 'partial';

export interface Program {
    id: number;
    name: string;
    degree_level?: string;
    duration_semesters?: number;
}

export interface StudentUser {
    id: number;
    name: string;
    email: string;
    role?: UserRole;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface StudentDocument {
    id: number;
    student_id: number;
    title: string;
    category: 'admission' | 'identity' | 'academic' | 'financial' | 'other';
    file_path: string;
    file_type?: string;
    file_size?: number;
    created_at: string;
}

export interface StudentPayment {
    id: number;
    student_id: number;
    invoice_id?: number | null;
    transaction_no: string;
    amount: number | string;
    payment_method: 'bank_transfer' | 'cash' | 'card' | 'online' | 'cheque';
    payment_date: string;
    receipt_path?: string | null;
    status: 'pending' | 'approved' | 'rejected';
    notes?: string | null;
    created_at: string;
    invoice?: StudentInvoice;
}

export interface StudentInvoice {
    id: number;
    student_id: number;
    invoice_no: string;
    title: string;
    type: 'tuition' | 'registration' | 'exam' | 'lab' | 'library' | 'other';
    amount: number | string;
    paid_amount: number | string;
    due_date?: string | null;
    status: 'paid' | 'unpaid' | 'partial' | 'overdue';
    created_at: string;
    payments?: StudentPayment[];
}

export interface StudentGrade {
    id: number;
    student_id: number;
    course_code: string;
    course_name: string;
    semester: number;
    credits: number;
    grade?: string | null;
    grade_point?: number | string | null;
    status: 'passed' | 'failed' | 'in_progress';
    created_at?: string;
}

export interface StudentCertificate {
    id: number;
    student_id: number;
    certificate_no: string;
    title: string;
    type: 'degree' | 'diploma' | 'completion' | 'honor' | 'other';
    issue_date: string;
    status: 'active' | 'revoked';
    file_path?: string | null;
    created_at: string;
}

export interface StudentAttendance {
    id: number;
    student_id: number;
    course_name: string;
    date: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    notes?: string | null;
}

export interface Student {
    id: number;
    user_id: number;
    matric_no: string;
    program_id?: number | null;
    current_semester: number;
    phone?: string | null;
    gender?: string | null;
    date_of_birth?: string | null;
    address?: string | null;
    fee_status: StudentFeeStatus;
    enrollment_status: EnrollmentStatus;
    gpa?: number | string | null;
    enrollment_date?: string | null;
    graduation_date?: string | null;
    created_at: string;
    updated_at: string;
    user?: StudentUser;
    program?: Program;
    documents?: StudentDocument[];
    invoices?: StudentInvoice[];
    payments?: StudentPayment[];
    grades?: StudentGrade[];
    certificates?: StudentCertificate[];
    attendances?: StudentAttendance[];
}

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

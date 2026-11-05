export type PayrollStatus = 'paid' | 'partial' | 'unpaid';

export interface PayrollRow {
    lecturer_id: number;
    name: string;
    email: string | null;
    lecturer_no: string | null;
    department: string | null;
    sessions: number;
    hours: number;
    total: number;
    paid: number;
    outstanding: number;
    status: PayrollStatus;
}

export interface PayrollStats {
    lecturers: number;
    hours: number;
    total: number;
    paid: number;
    outstanding: number;
}

export interface PayrollEntry {
    id: number;
    course: string;
    session_date: string;
    hours: number;
    hourly_rate: number;
    amount: number;
    notes: string | null;
    paid: boolean;
}

export interface PayrollCourseTotal {
    course_id: number;
    code: string;
    name: string;
    sessions: number;
    hours: number;
    total: number;
}

export interface PayrollFormOptions {
    default_rate: number;
    lecturers: Array<{ id: number; name: string; lecturer_no: string }>;
    courses: Array<{ id: number; code: string; name: string }>;
}

export const formatMoney = (value: number): string =>
    new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(value);

export const formatHours = (value: number): string =>
    `${Number(value.toFixed(2))} h`;

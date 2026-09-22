import {
    BarChart3,
    BookOpen,
    Calendar,
    ClipboardList,
    CreditCard,
    FileText,
    GraduationCap,
    LayoutGrid,
    Receipt,
    ScrollText,
    Settings,
    Shield,
    UserPlus,
    Users,
    Wallet,
} from 'lucide-react';
import type { NavItem } from '@/types';

export const adminNav: NavItem[] = [
    { title: 'nav_dashboard', href: '/admin/dashboard', icon: LayoutGrid },
    {
        title: 'nav_students',
        icon: Users,
        items: [
            { title: 'nav_students', href: '/admin/students', icon: Users },
            { title: 'nav_admissions', href: '/admin/admissions', icon: UserPlus },
        ],
    },
    {
        title: 'nav_lecturers',
        icon: GraduationCap,
        items: [
            {
                title: 'nav_lecturers',
                href: '/admin/lecturers',
                icon: GraduationCap,
            },
            {
                title: 'nav_assignments',
                href: '/admin/assignments',
                icon: ClipboardList,
            },
        ],
    },

    {
        title: 'nav_academic',
        icon: BookOpen,
        items: [
            { title: 'nav_programs', href: '/admin/programs', icon: BookOpen },
            { title: 'nav_courses', href: '/admin/courses', icon: BookOpen },
            { title: 'nav_semesters', href: '/admin/semesters', icon: Calendar },
            { title: 'nav_enrollments', href: '/admin/enrollments', icon: Users },
            {
                title: 'nav_transcripts',
                href: '/admin/transcripts',
                icon: ScrollText,
            },
        ],
    },

    {
        title: 'nav_finance',
        icon: Wallet,
        items: [
            { title: 'nav_finance_overview', href: '/admin/finance', icon: Wallet },
            { title: 'nav_fees', href: '/admin/finance/fees', icon: Receipt },
            {
                title: 'nav_payments',
                href: '/admin/finance/payments',
                icon: CreditCard,
            },
            {
                title: 'nav_invoices',
                href: '/admin/finance/invoices',
                icon: FileText,
            },
            {
                title: 'nav_expenses',
                href: '/admin/expenses',
                icon: Receipt,
            },
            {
                title: 'nav_chart_of_accounts',
                href: '/admin/finance/chart-of-accounts',
                icon: BookOpen,
            },
        ],
    },
    { title: 'nav_reports', href: '/admin/reports', icon: BarChart3 },
    {
        title: 'nav_settings',
        icon: Settings,
        items: [
            {
                title: 'nav_general_settings',
                href: '/admin/settings/system',
                icon: Settings,
            },
            {
                title: 'nav_user_management',
                href: '/admin/settings/users',
                icon: Users,
            },
            {
                title: 'nav_roles_permissions',
                href: '/admin/settings/roles',
                icon: Shield,
            },
            {
                title: 'nav_audit_log',
                href: '/admin/settings/audit-log',
                icon: ScrollText,
            },
        ],
    },
];

export const financeNav: NavItem[] = [
    { title: 'nav_dashboard', href: '/finance/dashboard', icon: LayoutGrid },
    {
        title: 'nav_finance_expenses',
        icon: Wallet,
        items: [
            { title: 'nav_all_expenses', href: '/finance/expenses', icon: Receipt },
            { title: 'nav_approvals', href: '/finance/approvals', icon: Shield },
        ],
    },
    { title: 'nav_invoices', href: '/finance/invoices', icon: FileText },
    { title: 'nav_payments', href: '/finance/payments', icon: CreditCard },
    { title: 'nav_reports', href: '/finance/reports', icon: BarChart3 },
];

export const lecturerNav: NavItem[] = [
    { title: 'nav_dashboard', href: '/lecturer/dashboard', icon: LayoutGrid },
    { title: 'nav_my_courses', href: '/lecturer/courses', icon: BookOpen },
    { title: 'nav_students', href: '/lecturer/students', icon: Users },
    { title: 'nav_attendance', href: '/lecturer/attendance', icon: ClipboardList },
    { title: 'nav_gradebook', href: '/lecturer/gradebook', icon: GraduationCap },
    { title: 'nav_materials', href: '/lecturer/materials', icon: FileText },
];

export const studentNav: NavItem[] = [
    { title: 'nav_dashboard', href: '/student/dashboard', icon: LayoutGrid },
    { title: 'nav_my_courses', href: '/student/courses', icon: BookOpen },
    { title: 'nav_grades', href: '/student/grades', icon: GraduationCap },
    { title: 'nav_attendance', href: '/student/attendance', icon: ClipboardList },
    { title: 'nav_fees', href: '/student/fees', icon: CreditCard },
    { title: 'nav_documents', href: '/student/documents', icon: FileText },
    {
        title: 'nav_certificates',
        href: '/student/certificates',
        icon: ScrollText,
    },
];

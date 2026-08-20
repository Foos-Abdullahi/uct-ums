import {
    BarChart3,
    BookOpen,
    Building2,
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
    { title: 'Dashboard', href: '/admin/dashboard', icon: LayoutGrid },
    {
        title: 'Students',
        icon: Users,
        items: [
            { title: 'Students', href: '/admin/students', icon: Users },
            { title: 'Admissions', href: '/admin/admissions', icon: UserPlus },
        ],
    },
    {
        title: 'Lecturers',
        icon: GraduationCap,
        items: [
            {
                title: 'Lecturers',
                href: '/admin/lecturers',
                icon: GraduationCap,
            },
            {
                title: 'Assignments',
                href: '/admin/assignments',
                icon: ClipboardList,
            },
        ],
    },


    
    {
        title: 'Academic',
        icon: BookOpen,
        items: [
            { title: 'Programs', href: '/admin/programs', icon: BookOpen },
            { title: 'Courses', href: '/admin/courses', icon: BookOpen },
            { title: 'Semesters', href: '/admin/semesters', icon: Calendar },
            { title: 'Enrollments', href: '/admin/enrollments', icon: Users },
            {
                title: 'Transcripts',
                href: '/admin/transcripts',
                icon: ScrollText,
            },
        ],
    },

    {
        title: 'Finance',
        icon: Wallet,
        items: [
            { title: 'Overview', href: '/admin/finance', icon: Wallet },
            { title: 'Fees', href: '/admin/finance/fees', icon: Receipt },
            {
                title: 'Payments',
                href: '/admin/finance/payments',
                icon: CreditCard,
            },
            {
                title: 'Invoices',
                href: '/admin/finance/invoices',
                icon: FileText,
            },
        ],
    },
    { title: 'Reports', href: '/admin/reports', icon: BarChart3 },
    {
        title: 'Settings',
        icon: Settings,
        items: [
            { title: 'Users', href: '/admin/settings/users', icon: Users },
            {
                title: 'Roles & Permissions',
                href: '/admin/settings/roles',
                icon: Shield,
            },
            {
                title: 'Audit Log',
                href: '/admin/settings/audit-log',
                icon: ScrollText,
            },
            {
                title: 'University',
                href: '/admin/settings/university',
                icon: Building2,
            },
            {
                title: 'Academic',
                href: '/admin/settings/academic',
                icon: BookOpen,
            },
            {
                title: 'System',
                href: '/admin/settings/system',
                icon: Settings,
            },
        ],
    },
];

export const lecturerNav: NavItem[] = [
    { title: 'Dashboard', href: '/lecturer/dashboard', icon: LayoutGrid },
    { title: 'My Courses', href: '/lecturer/courses', icon: BookOpen },
    { title: 'Students', href: '/lecturer/students', icon: Users },
    { title: 'Attendance', href: '/lecturer/attendance', icon: ClipboardList },
    { title: 'Gradebook', href: '/lecturer/gradebook', icon: GraduationCap },
    { title: 'Materials', href: '/lecturer/materials', icon: FileText },
];

export const studentNav: NavItem[] = [
    { title: 'Dashboard', href: '/student/dashboard', icon: LayoutGrid },
    { title: 'My Courses', href: '/student/courses', icon: BookOpen },
    { title: 'Grades', href: '/student/grades', icon: GraduationCap },
    { title: 'Attendance', href: '/student/attendance', icon: ClipboardList },
    { title: 'Fees', href: '/student/fees', icon: CreditCard },
    { title: 'Documents', href: '/student/documents', icon: FileText },
    {
        title: 'Certificates',
        href: '/student/certificates',
        icon: ScrollText,
    },
];
